import pytest

from backend.step3 import metrics
from backend.step3_models import prediction
from backend.step3_protocol import assert_disjoint, choose_members


def test_metrics_report_both_classes_and_fixed_matrix_order():
    metrics_result = metrics(
        ["parasitized"] * 3 + ["uninfected"] * 2,
        ["parasitized"] * 2 + ["uninfected", "parasitized", "uninfected"],
    )
    assert metrics_result["confusion_matrix"] == [[2, 1], [1, 1]]
    assert metrics_result["per_class"]["parasitized"]["recall"] == 2 / 3
    assert metrics_result["per_class"]["uninfected"]["recall"] == 0.5
    assert metrics_result["balanced_accuracy"] == pytest.approx((2 / 3 + 0.5) / 2)


def test_relative_scores_preserve_class_order_and_require_finite_values():
    result = prediction([-0.3, -0.1])
    assert result.label == "uninfected"
    assert result.scores == {"parasitized": -0.3, "uninfected": -0.1}
    with pytest.raises(ValueError, match="nonfinite"):
        prediction([float("nan"), 1.0])


def test_group_guard_rejects_cross_partition_source_leakage():
    dev = {"group": "a", "source_image": "shared", "sha256": "a"}
    test = {"group": "b", "source_image": "shared", "sha256": "b"}
    with pytest.raises(ValueError, match="source_image"):
        assert_disjoint({"development": [dev], "test": [test]})


def test_frozen_sampling_is_balanced_and_diverse():
    rows = [{"group": group, "label": label, "sha256": f"{group}-{label}-{index}"}
            for group in ("a", "b") for label in ("parasitized", "uninfected") for index in range(3)]
    sample = choose_members(rows, "test", 2)
    assert sample == choose_members(list(reversed(rows)), "test", 2)
    assert [row["label"] for row in sample] == ["parasitized"] * 2 + ["uninfected"] * 2
    assert {row["group"] for row in sample[:2]} == {"a", "b"}
