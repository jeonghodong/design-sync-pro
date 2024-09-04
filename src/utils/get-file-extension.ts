export function getFileExtension(data) {
  const uint8Array = new Uint8Array(data);
  const signature = uint8Array.slice(0, 4).join(' ');
  if (signature === '137 80 78 71') return 'png';
  if (signature.startsWith('255 216 255')) return 'jpg';
  const svgSignature = new TextDecoder().decode(uint8Array.slice(0, 5));
  if (svgSignature === '<?xml' || svgSignature.startsWith('<svg')) return 'svg';
  return 'unknown';
}
