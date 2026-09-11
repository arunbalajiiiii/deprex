class IntelligenceUnavailableError(Exception):
    """Raised when an external intelligence provider is unreachable or fails critically."""

    def __init__(self, message: str = "The intelligence service is temporarily unavailable."):
        super().__init__(message)
        self.message = message
