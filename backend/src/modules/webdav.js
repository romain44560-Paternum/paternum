const { NEXTCLOUD_URL } = process.env;

// Liste les fichiers d'un dossier Nextcloud via WebDAV
const listFiles = async (ncToken, path, ncUserId = 'admin') => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${NEXTCLOUD_URL}/remote.php/dav/files/${ncUserId}/${cleanPath}`;

  const res = await fetch(url, {
    method: 'PROPFIND',
    headers: {
      Authorization: `Bearer ${ncToken}`,
      Depth: '1',
      'Content-Type': 'application/xml',
    },
    body: `<?xml version="1.0"?>
      <d:propfind xmlns:d="DAV:">
        <d:prop>
          <d:displayname/>
          <d:getcontenttype/>
          <d:getlastmodified/>
          <d:getcontentlength/>
        </d:prop>
      </d:propfind>`,
  });

  if (!res.ok) throw new Error(`WebDAV erreur: ${res.status}`);

  const xml = await res.text();

  // Parse basique du XML WebDAV
  const files = [];
  const responseRegex = /<d:response>([\s\S]*?)<\/d:response>/g;
  let match;

  while ((match = responseRegex.exec(xml)) !== null) {
    const block = match[1];
    const href = block.match(/<d:href>(.*?)<\/d:href>/)?.[1] || '';
    const name = block.match(/<d:displayname>(.*?)<\/d:displayname>/)?.[1] || '';
    const type = block.match(/<d:getcontenttype>(.*?)<\/d:getcontenttype>/)?.[1] || '';
    const modified = block.match(/<d:getlastmodified>(.*?)<\/d:getlastmodified>/)?.[1] || '';
    const size = block.match(/<d:getcontentlength>(.*?)<\/d:getcontentlength>/)?.[1] || 0;

    // Ignore les dossiers, garde seulement les fichiers
    if (name && type && !type.includes('directory')) {
      files.push({
        name,
        href: decodeURIComponent(href),
        type,
        modified: new Date(modified),
        size: parseInt(size),
      });
    }
  }

  return files;
};

// Télécharge un fichier depuis Nextcloud
const downloadFile = async (ncToken, href) => {
  const url = `${NEXTCLOUD_URL}${href}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${ncToken}` },
  });
  if (!res.ok) throw new Error(`Download erreur: ${res.status}`);
  return res.arrayBuffer();
};

module.exports = { listFiles, downloadFile };