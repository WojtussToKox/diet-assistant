class DietServiceError(Exception):
    """Base exception for all diets service-layer errors."""
    pass


class DataAggregationError(DietServiceError):
    """ Raised when there is no data available to aggregate or analyze."""
    pass


class FileExportError(DietServiceError):
    """Raised when writing an export file (JSON/CSV) fails at the OS level."""
    pass


class ProductImportError(DietServiceError):
    """Base exception for all Product CSV import errors."""
    pass


class CSVFileNotFoundError(ProductImportError):
    """Raised when the given CSV path does not exist on disk."""
    pass


class InvalidCSVStructureError(ProductImportError):
    """Raised when the CSV header is missing required columns."""
    pass

class MissingRecipeError(DietServiceError):
    """Raised when a ScheduledMeal has no recipe assigned during calculation or aggregation."""
    pass