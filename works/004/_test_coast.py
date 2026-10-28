"""Tests for _coast.py, the coastline grid. Run: python3 works/004/_test_coast.py"""
import unittest

import _coast as coast


class T(unittest.TestCase):
    def square(self, x0, y0, s):  # counter-clockwise ring: land inside (left of the way)
        return [(x0, y0), (x0 + s, y0), (x0 + s, y0 + s), (x0, y0 + s), (x0, y0)]

    def test_inside_is_land_outside_is_water(self):
        b = coast.bucket([self.square(100, 100, 200)], 50)
        self.assertTrue(coast.land_side(200, 200, b))
        self.assertFalse(coast.land_side(50, 50, b))

    def test_near_a_convex_corner_outside_is_water(self):
        b = coast.bucket([self.square(100, 100, 200)], 50)
        self.assertFalse(coast.land_side(95, 95, b))  # nearest point is the shared vertex (100, 100)
        self.assertTrue(coast.land_side(105, 105, b))

    def test_far_from_any_coast_still_finds_the_nearest_segment(self):
        b = coast.bucket([self.square(100, 100, 200)], 50)
        self.assertFalse(coast.land_side(900, 900, b))

    def test_specks_removed(self):
        g = [[False] * 5 for _ in range(5)]
        g[2][2] = True  # lone land cell
        self.assertFalse(coast.remove_specks(g, 6)[2][2])
        g = [[True] * 5 for _ in range(5)]
        g[2][2] = False  # lone water cell
        self.assertTrue(coast.remove_specks(g, 6)[2][2])

    def test_label_by_seed_and_drop_unseeded(self):
        g = [[c in (0, 1) for c in range(6)] for _ in range(3)]  # columns 0-1 land
        g[1][4] = True  # unseeded land cell
        rows = coast.label(g, {'1': (0, 0)})  # seed as (row, col)
        self.assertEqual(rows[0][:2], '11')
        self.assertEqual(rows[1][4], '0')
        self.assertEqual(rows[2][3], '0')


if __name__ == '__main__':
    unittest.main()
