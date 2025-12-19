import * as fs from 'fs';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  info: {
    dpi?: number;
    widthCm?: number;
    heightCm?: number;
    widthPx?: number;
    heightPx?: number;
    // Informações sobre conteúdo real
    contentHeightCm?: number;
    contentWidthCm?: number;
    hasEmptySpace?: boolean;
    emptySpacePercentage?: number;
  } | null;
}

export class ImageValidator {
  async validate(
    filePath: string,
    config: {
      minDPI: number;
      maxDPI: number;
      widthCm: number;
      widthTolerance?: number;
      minHeightCm: number;
    }
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    let info: ValidationResult['info'] = null;

    const ext = filePath.toLowerCase().split('.').pop();

    if (ext === 'png') {
      info = await this.validatePNG(filePath);
    } else if (ext === 'tiff' || ext === 'tif') {
      info = await this.validateTIFF(filePath);
    } else if (ext === 'pdf') {
      info = await this.validatePDF(filePath);
    } else {
      return {
        valid: false,
        errors: ['Formato de arquivo não suportado. Use PNG, TIFF ou PDF.'],
        info: null,
      };
    }

    if (!info) {
      return {
        valid: false,
        errors: ['Não foi possível ler as informações da imagem.'],
        info: null,
      };
    }

    // Validar DPI
    if (info.dpi) {
      if (info.dpi < config.minDPI || info.dpi > config.maxDPI) {
        errors.push(
          `DPI fora do intervalo permitido. Atual: ${info.dpi.toFixed(0)}, Requerido: ${config.minDPI}-${config.maxDPI}`
        );
      }
    } else {
      errors.push('Não foi possível determinar o DPI da imagem.');
    }

    // Validar largura (com tolerância configurável)
    // A tolerância só permite valores MENORES que o máximo (o máximo é o TETO)
    // Exemplo: Se máximo é 58cm e tolerância é 2cm, aceita de 56cm até 58cm (não aceita 60cm)
    if (info.widthCm) {
      const widthTolerance = config.widthTolerance || 2.5; // Fallback para 2.5cm se não especificado
      const minWidth = config.widthCm - widthTolerance;
      const maxWidth = config.widthCm; // O máximo é o TETO, não pode ser ultrapassado
      
      if (info.widthCm > maxWidth) {
        errors.push(
          `Largura acima do máximo permitido. Atual: ${info.widthCm.toFixed(2)}cm, Máximo: ${maxWidth.toFixed(2)}cm`
        );
      } else if (info.widthCm < minWidth) {
        errors.push(
          `Largura abaixo do mínimo permitido. Atual: ${info.widthCm.toFixed(2)}cm, Mínimo: ${minWidth.toFixed(2)}cm (Máximo: ${maxWidth.toFixed(2)}cm, Tolerância: ${widthTolerance.toFixed(1)}cm)`
        );
      }
    } else {
      errors.push('Não foi possível determinar a largura da imagem.');
    }

    // Validar altura mínima
    if (info.heightCm) {
      if (info.heightCm < config.minHeightCm) {
        errors.push(
          `Altura abaixo do mínimo. Atual: ${info.heightCm.toFixed(2)}cm, Mínimo: ${config.minHeightCm}cm`
        );
      }
    } else {
      errors.push('Não foi possível determinar a altura da imagem.');
    }

    return {
      valid: errors.length === 0,
      errors,
      info,
    };
  }

  private async validatePNG(filePath: string): Promise<ValidationResult['info']> {
    try {
      const metadata = await sharp(filePath).metadata();
      const dpi = metadata.density || 72;
      
      // Converter pixels para cm (assumindo DPI)
      const widthCm = (metadata.width! / dpi) * 2.54;
      const heightCm = (metadata.height! / dpi) * 2.54;

      // Detectar conteúdo real (bounding box do conteúdo não-transparente)
      const contentBounds = await this.detectContentBounds(filePath, dpi);

      return {
        dpi,
        widthCm,
        heightCm,
        widthPx: metadata.width,
        heightPx: metadata.height,
        contentHeightCm: contentBounds?.heightCm,
        contentWidthCm: contentBounds?.widthCm,
        hasEmptySpace: contentBounds?.hasEmptySpace || false,
        emptySpacePercentage: contentBounds?.emptySpacePercentage,
      };
    } catch (error) {
      console.error('Erro ao validar PNG:', error);
      return null;
    }
  }

  private async validateTIFF(filePath: string): Promise<ValidationResult['info']> {
    try {
      const metadata = await sharp(filePath).metadata();
      const dpi = metadata.density || 72;
      
      // Converter pixels para cm (assumindo DPI)
      const widthCm = (metadata.width! / dpi) * 2.54;
      const heightCm = (metadata.height! / dpi) * 2.54;

      // Detectar conteúdo real (bounding box do conteúdo não-transparente)
      // TIFF também pode ter transparência, então usamos a mesma lógica do PNG
      const contentBounds = await this.detectContentBounds(filePath, dpi);

      return {
        dpi,
        widthCm,
        heightCm,
        widthPx: metadata.width,
        heightPx: metadata.height,
        contentHeightCm: contentBounds?.heightCm,
        contentWidthCm: contentBounds?.widthCm,
        hasEmptySpace: contentBounds?.hasEmptySpace || false,
        emptySpacePercentage: contentBounds?.emptySpacePercentage,
      };
    } catch (error) {
      console.error('Erro ao validar TIFF:', error);
      return null;
    }
  }

  /**
   * Detecta o bounding box do conteúdo real (não-transparente) em uma imagem PNG
   */
  private async detectContentBounds(filePath: string, dpi: number): Promise<{
    heightCm: number;
    widthCm: number;
    hasEmptySpace: boolean;
    emptySpacePercentage: number;
  } | null> {
    try {
      // Ler dados da imagem
      const image = sharp(filePath);
      const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      
      const width = info.width;
      const height = info.height;
      const channels = info.channels; // RGBA = 4 canais
      
      // Encontrar bounding box do conteúdo não-transparente
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
      let hasContent = false;

      // Percorrer pixels para encontrar conteúdo não-transparente
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * channels;
          const alpha = data[idx + 3]; // Canal alpha (transparência)
          
          // Se pixel não é totalmente transparente (alpha > 0)
          if (alpha > 0) {
            hasContent = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // Se não encontrou conteúdo, retornar null
      if (!hasContent || minX > maxX || minY > maxY) {
        return null;
      }

      // Calcular dimensões do conteúdo real
      const contentWidthPx = maxX - minX + 1;
      const contentHeightPx = maxY - minY + 1;
      
      const contentWidthCm = (contentWidthPx / dpi) * 2.54;
      const contentHeightCm = (contentHeightPx / dpi) * 2.54;

      // Calcular área total vs área do conteúdo
      const totalArea = width * height;
      const contentArea = contentWidthPx * contentHeightPx;
      const emptySpacePercentage = ((totalArea - contentArea) / totalArea) * 100;

      // Considerar espaço vazio significativo se > 25%
      const hasEmptySpace = emptySpacePercentage > 25;

      return {
        heightCm: contentHeightCm,
        widthCm: contentWidthCm,
        hasEmptySpace,
        emptySpacePercentage: Math.round(emptySpacePercentage * 10) / 10, // Arredondar para 1 decimal
      };
    } catch (error) {
      console.warn('Erro ao detectar conteúdo real:', error);
      // Em caso de erro, retornar null (não bloquear validação)
      return null;
    }
  }

  private async validatePDF(filePath: string): Promise<ValidationResult['info']> {
    try {
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        return null;
      }

      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // PDF geralmente usa pontos (1 ponto = 1/72 polegada)
      // Converter para cm
      const widthCm = (width / 72) * 2.54;
      const heightCm = (height / 72) * 2.54;
      
      // Tentar obter DPI do PDF (pode não estar disponível)
      // Assumir 300 DPI como padrão para PDFs de alta qualidade
      const dpi = 300;

      return {
        dpi,
        widthCm,
        heightCm,
        widthPx: width,
        heightPx: height,
      };
    } catch (error) {
      console.error('Erro ao validar PDF:', error);
      return null;
    }
  }
}


