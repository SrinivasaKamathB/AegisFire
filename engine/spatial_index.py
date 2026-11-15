"""
AegisFire: Spatial Indexing Engine
Implements discrete global hexagonal spatial tessellation for binning satellite hotspot coordinates.
Eliminates diagonal distortion inherent to square lat/long grids.
"""

import math
from typing import Tuple, List, Dict

class HexagonalSpatialIndex:
    """
    Computes deterministic hexagonal bin IDs and geometries from coordinates.
    Uses axial coordinate projection (q, r) mapped to latitude and longitude.
    """
    def __init__(self, cell_size_km: float = 3.0):
        # Approximate degrees per km (at mid-latitude ~37 deg N, California)
        self.cell_size_km = cell_size_km
        self.km_per_deg_lat = 111.0
        self.mid_lat = 37.0
        self.km_per_deg_lon = 111.0 * math.cos(math.radians(self.mid_lat))
        
        # Hexagon spacing in degrees
        self.dx = (cell_size_km / self.km_per_deg_lon) * math.sqrt(3)
        self.dy = (cell_size_km / self.km_per_deg_lat) * 1.5

    def lat_lon_to_hex(self, lat: float, lon: float) -> str:
        """Converts lat/lon to a deterministic hexagon index string: 'hex_q_r'."""
        # Project to flat Cartesian coordinates relative to base (32N, -125W)
        x = (lon - (-125.0)) * self.km_per_deg_lon
        y = (lat - 32.0) * self.km_per_deg_lat
        
        # Axial coordinate transformation for flat-topped hexagons
        q = (math.sqrt(3)/3 * x - 1/3 * y) / self.cell_size_km
        r = (2/3 * y) / self.cell_size_km
        
        # Cube rounding algorithm
        x_c = q
        z_c = r
        y_c = -x_c - z_c
        
        rx = round(x_c)
        ry = round(y_c)
        rz = round(z_c)
        
        x_diff = abs(rx - x_c)
        y_diff = abs(ry - y_c)
        z_diff = abs(rz - z_c)
        
        if x_diff > y_diff and x_diff > z_diff:
            rx = -ry - rz
        elif y_diff > z_diff:
            ry = -rx - rz
        else:
            rz = -rx - ry
            
        return f"hex_{int(rx)}_{int(rz)}"

    def hex_to_center_lat_lon(self, hex_id: str) -> Tuple[float, float]:
        """Recovers center lat/lon from hex ID."""
        parts = hex_id.split('_')
        q = int(parts[1])
        r = int(parts[2])
        
        x = self.cell_size_km * (math.sqrt(3) * q + math.sqrt(3)/2 * r)
        y = self.cell_size_km * (3/2 * r)
        
        lon = -125.0 + (x / self.km_per_deg_lon)
        lat = 32.0 + (y / self.km_per_deg_lat)
        return round(lat, 5), round(lon, 5)

    def get_hex_polygon(self, lat: float, lon: float) -> List[List[float]]:
        """Returns 6-point polygon boundary [lat, lon] for GeoJSON or Canvas rendering."""
        points = []
        r_deg_lat = (self.cell_size_km / self.km_per_deg_lat)
        r_deg_lon = (self.cell_size_km / self.km_per_deg_lon)
        
        for i in range(6):
            angle_deg = 60 * i - 30
            angle_rad = math.radians(angle_deg)
            p_lat = lat + r_deg_lat * math.sin(angle_rad)
            p_lon = lon + r_deg_lon * math.cos(angle_rad)
            points.append([round(p_lat, 5), round(p_lon, 5)])
        points.append(points[0])  # Close polygon
        return points
