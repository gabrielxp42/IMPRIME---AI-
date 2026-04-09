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
    pageCount?: number;
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
    },
    page: number = 1
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    let info: ValidationResult['info'] = null;
    const cacheKey = `${filePath}::${page}`;

    // Tentar obter do cache primeiro
    if (this.metadataCache.has(cacheKey)) {
      info = this.metadataCache.get(cacheKey)!;
    } else {
      console.log(`[Validator] Validando: ${filePath} (Pág: ${page})`);
      const ext = filePath.toLowerCase().split('.').pop();
      if (ext === 'png') {
        info = await this.validatePNG(filePath);
      } else if (ext === 'tiff' || ext === 'tif') {
        info = await this.validateTIFF(filePath);
      } else if (ext === 'pdf') {
        info = await this.validatePDF(filePath, page);
      }

      if (info) {
        this.metadataCache.set(cacheKey, info);
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

  private async validatePDF(filePath: string, pageNum: number = 1): Promise<ValidationResult['info']> {
    try {
      console.log(`[Validator] Iniciando validatePDF (Sharp): ${filePath} (Pág: ${pageNum})`);
      if (!fs.existsSync(filePath)) {
        console.error(`[Validator] Arquivo não encontrado: ${filePath}`);
        return null;
      }
      
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);

      // O Sharp é muito mais eficiente que o pdf-lib para apenas ler metadados de arquivos gigantes
      // pois ele usa libvips em C e não carrega o buffer inteiro no heap do V8.
      const pageIndex = pageNum - 1;
      const metadata = await sharp(filePath, { page: pageIndex }).metadata();
      
      if (!metadata) {
          throw new Error('Sharp não retornou metadados para o PDF');
      }

      // PDF padrão usa 72 DPI para as dimensões de pontos.
      // O Sharp pode retornar 'density' se estiver disponível.
      const dpi = metadata.density || 72;
      const widthPx = metadata.width || 0;
      const heightPx = metadata.height || 0;
      const pageCount = metadata.pages || 1;

      // Converter pontos/pixels para cm
      // No Sharp, width/height para PDF são em pontos tipográficos (1/72 pol) se a density for 72.
      const widthCm = (widthPx / dpi) * 2.54;
      const heightCm = (heightPx / dpi) * 2.54;

      console.log(`[Validator] PDF (Sharp) - Pág ${pageNum}: ${widthCm.toFixed(2)}x${heightCm.toFixed(2)}cm, ${dpi} DPI`);

      return {
        dpi: 300, // Forçamos 300 para o cálculo de Spot White posterior ser seguro
        widthCm,
        heightCm,
        widthPx,
        heightPx,
        pageCount,
      };
    } catch (error: any) {
      console.warn('[Validator] Sharp falhou ao validar PDF, tentando fallback pdf-lib:', error.message);
      try {
          const pdfBytes = fs.readFileSync(filePath);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const pages = pdfDoc.getPages();
          const targetPageNum = Math.max(1, Math.min(pageNum, pages.length));
          const targetPage = pages[targetPageNum - 1];
          const { width, height } = targetPage.getSize();

          return {
            dpi: 300,
            widthCm: (width / 72) * 2.54,
            heightCm: (height / 72) * 2.54,
            widthPx: width,
            heightPx: height,
            pageCount: pages.length,
          };
      } catch (innerError) {
          console.error('[Validator] Erro fatal ao validar PDF:', innerError);
          return null;
      }
    }
  }
}


