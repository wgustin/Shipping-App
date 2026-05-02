import { PDFDocument, degrees } from 'pdf-lib';
import { getValidAuthToken } from '../../services/apiClient';

export const printLabelPdf = async (labelUrl?: string | null, labelFormat?: string, paperSize?: string): Promise<void> => {
  if (!labelUrl) return;

  try {
    const token = await getValidAuthToken();
    const proxyUrl = `/api/proxy-label?url=${encodeURIComponent(labelUrl)}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch label: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    if (labelFormat?.toLowerCase() === 'zpl') {
      // Download ZPL file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `label-${Date.now()}.zpl`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }

    if (paperSize === '4x6') {
      // Just open the PDF/image as is
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
          // Fallback if popup blocker blocks the blob URL
          window.open(labelUrl, '_blank');
      }
      return;
    }

    // Check if it's a PDF by content type or if the URL ends with .pdf and it's not HTML
    const isPdf = blob.type === 'application/pdf' || 
                 (labelUrl!.toLowerCase().split('?')[0]?.endsWith('.pdf') && !blob.type.includes('text/html'));
    
    const arrayBuffer = await blob.arrayBuffer();
    const newPdf = await PDFDocument.create();
    const page = newPdf.addPage([8.5 * 72, 11 * 72]); // 8.5x11 inches in points
    
    if (isPdf) {
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const [embeddedPage] = await newPdf.embedPdf(originalPdf, [0]);
      if (!embeddedPage) throw new Error("Failed to embed PDF page");
      const embeddedDims = embeddedPage.scale(1);
      
      let drawX, drawY;
      
      // If the original PDF is already 8.5x11, the label is likely a 4x6 at the top-left
      if (Math.abs(embeddedDims.width - 8.5 * 72) < 10 && Math.abs(embeddedDims.height - 11 * 72) < 10) {
        // Original is 8.5x11. Label is at top-left.
        // Rotate 90 degrees and center the top-left 4x6 area in the top half (8.5 x 5.5)
        drawX = 882;
        drawY = 450;
      } else {
        // Original is likely 4x6.
        // Rotate 90 degrees and center in the top half.
        drawX = 522;
        drawY = 450;
      }
      
      page.drawPage(embeddedPage, {
        ...embeddedDims,
        x: drawX,
        y: drawY,
        rotate: degrees(90),
      });
    } else {
      // Handle image (PNG/JPG)
      let image;
      if (blob.type === 'image/png' || labelUrl!.toLowerCase().split('?')[0]?.endsWith('.png')) {
        image = await newPdf.embedPng(arrayBuffer);
      } else {
        image = await newPdf.embedJpg(arrayBuffer);
      }
      
      const imgDims = image.scale(1);
      const imgRatio = imgDims.width / imgDims.height;
      const targetRatio = 4 / 6; // We are fitting it into a 4x6 area (unrotated)
      
      let finalWidth, finalHeight;
      if (imgRatio > targetRatio) {
        finalWidth = 4 * 72;
        finalHeight = (4 * 72) / imgRatio;
      } else {
        finalHeight = 6 * 72;
        finalWidth = (6 * 72) * imgRatio;
      }
      
      // We want to draw this image rotated by 90 degrees, centered in the top half.
      const drawX = 306 + (finalHeight / 2);
      const drawY = 594 - (finalWidth / 2);
      
      page.drawImage(image, {
        x: drawX,
        y: drawY,
        width: finalWidth,
        height: finalHeight,
        rotate: degrees(90),
      });
    }
    
    const pdfBytes = await newPdf.save();
    const newBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(newBlob);
    window.open(pdfUrl, '_blank');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    window.open(labelUrl, '_blank');
  }
};
