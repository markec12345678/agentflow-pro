// Computer vision service stub
export class ComputerVisionService {
  async analyzePhoto(imageData: Buffer): Promise<any> {
    return { objects: [], quality: 0.8 };
  }
}

export const computerVisionService = new ComputerVisionService();
