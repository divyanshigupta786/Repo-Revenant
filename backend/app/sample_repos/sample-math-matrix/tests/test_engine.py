import pytest
from matrix_calc.engine import Matrix2D


def test_matrix_trace():
    m = Matrix2D([[4, 2], [1, 5]])
    assert m.trace() == 9


def test_matrix_determinant():
    m = Matrix2D([[4, 2], [1, 5]])
    assert m.determinant() == 18
