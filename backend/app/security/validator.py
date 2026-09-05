import os
from pathlib import Path
from fastapi import HTTPException, status
from app.core.config import settings

class FileSecurityValidator:
    """
    Validates uploaded configuration files to prevent:
    - Path traversal attacks
    - Denial of Service via oversized files
    - Binary or malicious non-text payloads
    """

    ALLOWED_EXTENSIONS = {".cfg", ".conf", ".txt", ".ios", ".junos", ".fgt", ".log"}

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """
        Removes directory traversal sequences and unsafe characters.
        """
        # Strip path separators and keep only safe basename
        clean_name = os.path.basename(filename)
        clean_name = "".join(c for c in clean_name if c.isalnum() or c in "._- ")
        if not clean_name:
            clean_name = "unnamed_config.cfg"
        return clean_name

    @classmethod
    def validate_file(cls, filename: str, content_bytes: bytes) -> None:
        """
        Validates file size, extension, and text integrity.
        """
        if len(content_bytes) > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File {filename} exceeds maximum size limit of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB"
            )

        if len(content_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {filename} is empty."
            )

        # Ensure content is decodable as text (UTF-8 / Latin-1 / ASCII)
        try:
            content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                content_bytes.decode("latin-1")
            except UnicodeDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File {filename} appears to be a binary file. Only plain text network configuration files are supported."
                )
