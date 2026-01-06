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
  private metadataCache = new Map<string, ValidationResult['info']>();

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

    // Tentar obter do cache primeiro
    if (this.metadataCache.has(filePath)) {
      info = this.metadataCache.get(filePath)!;
    } else {
      const ext = filePath.toLowerCase().split('.').pop();
      if (ext === 'png') {
        info = await this.validatePNG(filePath);
      } else if (ext === 'tiff' || ext === 'tif') {
        info = await this.validateTIFF(filePath);
      } else if (ext === 'pdf') {
        info = await this.validatePDF(filePath);
      }

      if (info) {
        this.metadataCache.set(filePath, info);
      }
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

    // Validar largura
    if (info.widthCm) {
      const widthTolerance = config.widthTolerance || 2.5;
      const minWidth = config.widthCm - widthTolerance;
      const maxWidth = config.widthCm;

      if (info.widthCm > maxWidth) {
        errors.push(
          `Largura acima do máximo permitido. Atual: ${info.widthCm.toFixed(2)}cm, Máximo: ${maxWidth.toFixed(2)}cm`
        );
      } else if (info.widthCm < minWidth) {
        errors.push(
          `Largura abaixo do mínimo permitido. Atual: ${info.widthCm.toFixed(2)}cm, Mínimo: ${minWidth.toFixed(2)}cm`
        );
      }
    }

    // Validar altura mínima
    if (info.heightCm) {
      if (info.heightCm < config.minHeightCm) {
        errors.push(
          `Altura abaixo do mínimo. Atual: ${info.heightCm.toFixed(2)}cm, Mínimo: ${config.minHeightCm}cm`
        );
      }
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
   * Detecta o bounding box do conteúdo real (não-transparente) usando sharp.trim()
   */
  private async detectContentBounds(filePath: string, dpi: number): Promise<{
    heightCm: number;
    widthCm: number;
    hasEmptySpace: boolean;
    emptySpacePercentage: number;
  } | null> {
    try {
      // Usar sharp para obter metadados originais
      const metadata = await sharp(filePath).metadata();
      const originalWidth = metadata.width || 0;
      const originalHeight = metadata.height || 0;

      if (originalWidth === 0 || originalHeight === 0) return null;

      // Usar trim() para encontrar o bounding box do conteúdo
      // A operação trim retorna a imagem cortada, então as dimensões dela são o conteúdo real
      // É muito mais rápido que iterar pixel a pixel
      const trimmedInfo = await sharp(filePath)
        .trim()
        .toBuffer({ resolveWithObject: true });

      const contentWidthPx = trimmedInfo.info.width;
      const contentHeightPx = trimmedInfo.info.height;

      const contentWidthCm = (contentWidthPx / dpi) * 2.54;
      const contentHeightCm = (contentHeightPx / dpi) * 2.54;

      // Calcular área total vs área do conteúdo
      const totalArea = originalWidth * originalHeight;
      const contentArea = contentWidthPx * contentHeightPx;
      const emptySpacePercentage = totalArea > 0 ? ((totalArea - contentArea) / totalArea) * 100 : 0;

      // Considerar espaço vazio significativo se > 20%
      const hasEmptySpace = emptySpacePercentage > 20;

      return {
        heightCm: contentHeightCm,
        widthCm: contentWidthCm,
        hasEmptySpace,
        emptySpacePercentage: Math.round(emptySpacePercentage * 10) / 10,
      };
    } catch (error) {
      console.warn('Erro ao detectar conteúdo real (trim):', error);
      // Fallback: assumir que é tudo conteúdo se falhar o trim (ex: imagem sem alpha)
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


