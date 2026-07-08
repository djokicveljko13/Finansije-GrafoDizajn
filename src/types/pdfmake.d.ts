// Minimalne deklaracije za pdfmake 0.3.x server API (paket ne nosi svoje tipove,
// a @types/pdfmake opisuje stari 0.2 API). Deklarisano je samo ono što koristimo.

declare module "pdfmake" {
  export type PdfDocDefinition = Record<string, unknown>;

  export interface PdfOutputDocument {
    getBuffer(): Promise<Buffer>;
    getBase64(): Promise<string>;
    write(filename: string): Promise<void>;
  }

  export interface PdfVirtualFs {
    existsSync(filename: string): boolean;
    readFileSync(filename: string): Buffer;
    writeFileSync(filename: string, content: Buffer | string): void;
  }

  export interface PdfMake {
    virtualfs: PdfVirtualFs;
    setFonts(fonts: Record<string, Record<string, string>>): void;
    setUrlAccessPolicy(callback?: (url: string) => boolean): void;
    setLocalAccessPolicy(callback?: (path: string) => boolean): void;
    createPdf(docDefinition: PdfDocDefinition): PdfOutputDocument;
  }

  const pdfmake: PdfMake;
  export default pdfmake;
}

declare module "pdfmake/build/vfs_fonts" {
  const vfs: Record<string, string>; // ime fajla -> base64 sadržaj
  export = vfs;
}
