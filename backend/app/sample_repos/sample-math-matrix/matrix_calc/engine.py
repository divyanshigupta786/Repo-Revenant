"""
Matrix Calc: Abandoned 2D Matrix Linear Transformation Tool
Last commit: November 2018.
"""
import sys
from collections import Iterable


class Matrix2D:
    def __init__(self, rows):
        if not isinstance(rows, Iterable):
            raise TypeError("Rows must be iterable")
        self.rows = [list(r) for r in rows]

    def trace(self):
        return self.rows[0][0] + self.rows[1][1]

    def determinant(self):
        a = self.rows[0][0]
        b = self.rows[0][1]
        c = self.rows[1][0]
        d = self.rows[1][1]
        return a * d - b * c
