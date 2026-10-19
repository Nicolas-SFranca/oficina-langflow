"""Leitura das variáveis de ambiente. Nada de segredo fica no código."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracao(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    admin_key: str
    cors_origins: str = "http://localhost:8080"
    public_api_url: str = "http://localhost:8000"
    neon_readonly_url: str = ""
    limite_acoes_por_minuto: int = 30
    limite_posts_por_hora: int = 5

    @property
    def origens_cors(self) -> list[str]:
        return [origem.strip() for origem in self.cors_origins.split(",") if origem.strip()]


config = Configuracao()
