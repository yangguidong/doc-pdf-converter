import os
from ..models.model_config import ModelConfig
from .base import BaseProvider, MockProvider

PROVIDER_MAP: dict[str, type[BaseProvider]] = {}


def _register_providers():
    """Lazy-load provider implementations if API keys are available."""
    from .base import MockProvider
    PROVIDER_MAP["mock"] = MockProvider

    try:
        from .runway import RunwayProvider
        PROVIDER_MAP["runway"] = RunwayProvider
    except ImportError:
        pass

    try:
        from .pika import PikaProvider
        PROVIDER_MAP["pika"] = PikaProvider
    except ImportError:
        pass

    try:
        from .kling import KlingProvider
        PROVIDER_MAP["kling"] = KlingProvider
    except ImportError:
        pass

    try:
        from .svd import SVDProvider
        PROVIDER_MAP["stability"] = SVDProvider
    except ImportError:
        pass


_register_providers()


def get_provider(model_config: ModelConfig) -> BaseProvider:
    provider_cls = PROVIDER_MAP.get(model_config.provider)
    if not provider_cls:
        raise ValueError(f"不支持的模型提供商: {model_config.provider}")
    return provider_cls(model_config)
