import pytest

from backend.dataset import canonical_groups, load_patient_mapping
from backend.evaluate import choose_sample, summarize


def test_patient_rows_merge_cross_slide_aliases():
    groups = canonical_groups({"c101p62thinf", "c101p62rethinf", "c102p62thinf", "c104p63thinf", "c105thinf"})
    assert groups["c101p62thinf"] == groups["c101p62rethinf"] == groups["c102p62thinf"]
    assert len(set(groups.values())) == 3


def test_patient_mapping_rejects_conflicting_group(tmp_path):
    table = tmp_path / "mapping.csv"
    table.write_text("C1,['image.png'],,\n", encoding="utf-8")
    assert load_patient_mapping(table) == {"image.png": "c1"}
    table.write_text("C1,['image.png'],,\nC2,['image.png'],,\n", encoding="utf-8")
    with pytest.raises(ValueError, match="Conflicting"):
        load_patient_mapping(table)


def test_sample_is_balanced_group_diverse_and_held_out():
    rows = [
        {"member": f"{label}/{group}-{index}.png", "label": label, "group": group, "split": split}
        for label in ("parasitized", "uninfected")
        for group, split in (("first", "held-out"), ("second", "held-out"), ("third", "development"))
        for index in range(3)
    ]
    sample = choose_sample(rows, 2)
    assert choose_sample(list(reversed(rows)), 2) == sample
    assert len(sample) == 4
    for label in ("parasitized", "uninfected"):
        assert {row["group"] for row in sample if row["label"] == label} == {"first", "second"}


def test_binary_metrics_use_parasitized_as_positive():
    summary = summarize(["parasitized", "parasitized", "uninfected"], ["parasitized", "uninfected", "uninfected"])
    assert summary["accuracy"] == 2 / 3
    assert summary["precision_parasitized"] == 1
    assert summary["recall_parasitized"] == 0.5
    assert summary["f1_parasitized"] == 2 / 3
    assert summary["confusion_matrix"]["rows_actual_columns_predicted"] == [[1, 1], [0, 1]]
