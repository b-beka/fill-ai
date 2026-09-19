import pytest
from pydantic import ValidationError
from app.ai.schemas import AnnotationItem, FrameAnalysisOutput


def test_valid_frame_analysis_output():
    data = {
        "keep": True,
        "informativeness": 0.85,
        "kind": "slide",
        "title": "Введение в квантовую механику",
        "ocr_markdown": "# Уравнение Шрёдингера\n$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$",
        "description": "Показано базовое уравнение Шрёдингера для описания волновой функции.",
        "annotations": [
            {
                "id": 1,
                "type": "box",
                "box_2d": [100, 150, 400, 850],
                "label": "Основное уравнение",
            }
        ],
        "duplicate_of_previous": False,
    }
    model = FrameAnalysisOutput.model_validate(data)
    assert model.keep is True
    assert model.informativeness == 0.85
    assert model.kind == "slide"
    assert len(model.annotations) == 1


def test_invalid_box_coordinates():
    # ymin >= ymax should raise validation error
    with pytest.raises(ValidationError):
        AnnotationItem(
            id=1,
            type="box",
            box_2d=[500, 100, 200, 300],  # ymin 500 > ymax 200
            label="Invalid",
        )

    # Coords out of range [0, 1000]
    with pytest.raises(ValidationError):
        AnnotationItem(
            id=1,
            type="box",
            box_2d=[-10, 0, 500, 500],
            label="Invalid",
        )
