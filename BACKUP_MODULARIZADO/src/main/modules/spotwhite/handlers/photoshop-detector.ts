import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PhotoshopDetector {
  private commonPaths = [
    'C:\\Program Files\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe',
    'C:\\Program Files\\Adobe\\Adobe Photoshop 2023\\Photoshop.exe',
    'C:\\Program Files\\Adobe\\Adobe Photoshop 2022\\Photoshop.exe',
    'C:\\Program Files\\Adobe\\Adobe Photoshop 2021\\Photoshop.exe',
    'C:\\Program Files\\Adobe\\Adobe Photoshop 2020\\Photoshop.exe',
    'C:\\Program Files (x86)\\Adobe\\Adobe Photoshop 2024\\Photoshop.exe',
    'C:\\Program Files (x86)\\Adobe\\Adobe Photoshop 2023\\Photoshop.exe',
    'C:\\Program Files (x86)\\Adobe\\Adobe Photoshop 2022\\Photoshop.exe',
    'C:\\Program Files (x86)\\Adobe\\Adobe Photoshop 2021\\Photoshop.exe',
    'C:\\Program Files (x86)\\Adobe\\Adobe Photoshop 2020\\Photoshop.exe',
  ];

  async detect(): Promise<{ found: boolean; path?: string; version?: string }> {
    // Tentar encontrar via registro do Windows
    try {
      const { stdout } = await execAsync(
        'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Adobe\\Photoshop" /s /v "InstallPath"'
      );
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('InstallPath')) {
          const match = line.match(/REG_SZ\s+(.+)/);
          if (match) {
            const installPath = match[1].trim();
            const photoshopExe = path.join(installPath, 'Photoshop.exe');
            if (fs.existsSync(photoshopExe)) {
              const version = this.extractVersion(installPath);
              return { found: true, path: photoshopExe, version };
            }
          }
        }
      }
    } catch (error) {
      // Continuar com outros métodos
    }

    // Tentar caminhos comuns
    for (const photoshopPath of this.commonPaths) {
      if (fs.existsSync(photoshopPath)) {
        const version = this.extractVersion(photoshopPath);
        return { found: true, path: photoshopPath, version };
      }
    }

    // Tentar via WMI
    try {
      const { stdout } = await execAsync(
        'wmic product where "name like \'%Photoshop%\'" get InstallLocation,Version'
      );
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes('InstallLocation') && !line.includes('InstallLocation')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            const installPath = parts[0];
            const photoshopExe = path.join(installPath, 'Photoshop.exe');
            if (fs.existsSync(photoshopExe)) {
              const version = parts[1] || 'Desconhecida';
              return { found: true, path: photoshopExe, version };
            }
          }
        }
      }
    } catch (error) {
      // Continuar
    }

    return { found: false };
  }

  private extractVersion(path: string): string {
    const match = path.match(/(\d{4})/);
    return match ? match[1] : 'Desconhecida';
  }
}


