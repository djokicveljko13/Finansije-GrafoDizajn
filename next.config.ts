import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // exceljs i pdfmake (pdfkit/fontkit) čitaju fontove/podatke sa fs-a — ne smeju u bundle
  serverExternalPackages: ["exceljs", "pdfmake"],
};

export default nextConfig;
