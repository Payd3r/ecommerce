function toPublicImageUrl(urlOrType, id, filename) {
    // Se chiamato con un solo argomento stringa (url relativo)
    if (arguments.length === 1) {
        const url = urlOrType;
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `http://localhost:3011${url}`;
    }
    // Se chiamato con type, id, filename
    if (urlOrType && id && filename) {
        return `http://localhost:3011/Media/${urlOrType}/${id}/${filename}`;
    }
    return null;
}

module.exports = { toPublicImageUrl }; 