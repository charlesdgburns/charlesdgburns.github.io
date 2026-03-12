import folium
import math

# Hike data (unchanged)
hikes = [
    {"name": "Chatsworth Hunting Tower", "distance_km": 6.1, "lat": 53.248, "lng": -1.622, 
     "link": "https://peakdistrictwalks.net/best-circular-walks-peak-district/", 
     "features": "Chatsworth Estate, woodland paths, aqueduct"},
    {"name": "Crook Hill", "distance_km": 7.1, "lat": 53.395, "lng": -1.709, 
     "link": "https://peakdistrictwalks.net/best-circular-walks-peak-district/", 
     "features": "Ladybower Reservoir vistas"},
    {"name": "Parkhouse & Chrome Hill", "distance_km": 7.4, "lat": 53.194, "lng": -1.872, 
     "link": "https://peakdistrictwalks.net/best-circular-walks-peak-district/", 
     "features": "Dragon's Back limestone ridges, fossils"},
    {"name": "Grindslow Knoll", "distance_km": 8.9, "lat": 53.365, "lng": -1.816, 
     "link": "https://peakdistrictwalks.net/best-circular-walks-peak-district/", 
     "features": "Kinder Plateau, Pennine Way start"},
    {"name": "Lud's Church", "distance_km": 9.7, "lat": 53.196, "lng": -1.997, 
     "link": "https://peakdistrictwalks.net/best-circular-walks-peak-district/", 
     "features": "Mossy chasm, riverside trails"},
    {"name": "Mam Tor & Lose Hill", "distance_km": 10.9, "lat": 53.342, "lng": -1.776, 
     "link": "https://peakdistrictwalks.net/best-circular-walks-peak-district/", 
     "features": "Great Ridge, 360° panoramas"},
    {"name": "Bamford Edge", "distance_km": 3.2, "lat": 53.348, "lng": -1.689, 
     "link": "https://thewanderingwildflower.co.uk/beautiful-walks-in-the-peak-district/", 
     "features": "Gritstone edge, reservoir views"},
    {"name": "Thor's Cave", "distance_km": 10.5, "lat": 53.097, "lng": -1.838, 
     "link": "https://thewanderingwildflower.co.uk/beautiful-walks-in-the-peak-district/", 
     "features": "Limestone cave, Manifold Valley"},
    {"name": "Chrome Hill", "distance_km": 19.3, "lat": 53.259, "lng": -1.911, 
     "link": "https://www.walkingenglishman.com/peakdistrict.htm", 
     "features": "Fossil-rich ridges, challenging terrain"},
    {"name": "Stanage Edge", "distance_km": 22.5, "lat": 53.340, "lng": -1.640, 
     "link": "https://peakdistrictwalks.net/best-circular-walks-peak-district/", 
     "features": "9 Edges Challenge, moorland trig points"}
]

# CORRECTED Campsite data with proper coordinates
campsites = [
    {  # Upper Booth Farm Campsite (Edale) - FIXED COORDINATES
        "name": "Upper Booth Farm Campsite",
        "price_per_night": 12,
        "lat": 53.365,  # Corrected to proper location
        "lng":  -1.845,  # Corrected to proper location
        "link": "https://tentbox.com/pages/campsites/upper-booth-farm-campsite",
        "features": "Pennine Way access, Kinder Scout hikes, river pitches, basic facilities",
        "type": "tent"
    },
    {  # Royal Oak Hurdlow
        "name": "The Royal Oak Campsite",
        "price_per_night": 15,
        "lat": 53.180,
        "lng": -1.810,
        "link": "https://www.royaloakhurdlow.co.uk/camping",
        "features": "Tissington/High Peak Trail access, onsite pub, fire pits",
        "type": "tent"
    },
    {  # North Lees (Stanage Edge)
        "name": "North Lees Campsite",
        "price_per_night": 12,
        "lat": 53.345267,
        "lng": -1.64821,
        "link": "https://www.peakdistrict.gov.uk/visiting/things-to-do/camping/camping-northlees",
        "features": "Stanage Edge climbing, wheelbarrow transport, no solid fuels",
        "type": "tent"
    },
    {  # Newfold Farm (CORRECTED coordinates)
        "name": "Newfold Farm",
        "price_per_night": 22,
        "lat": 53.382,  # Corrected location
        "lng": -1.944,  # Corrected location
        "link": "https://www.terra-nova.co.uk/blog/best-places-to-camp/",
        "features": "Kinder Scout access, Pennine Way trailhead",
        "type": "tent"
    },
    {  # Crowden Camping Club
        "name": "Crowden Camping Club Site",
        "price_per_night": 10.50,
        "lat": 53.4895,
        "lng": -1.8930,
        "link": "https://www.campingandcaravanningclub.co.uk/campsites/uk/glossop/crowden/crowden-camping-and-caravanning-club-site/",
        "features": "Pennine Way access, Howden Reservoir, walkers' paradise",
        "type": "tent"
    },
    {  # Callow Top Holiday Park
        "name": "Callow Top Holiday Park",
        "price_per_night": 19,
        "lat": 53.015,
        "lng": -1.731,
        "link": "https://www.callowtop.co.uk",
        "features": "Heated pool, Tissington Trail access",
        "type": "tent"
    },
    {  # Derbyshire Hills Campsite
        "name": "Derbyshire Hills Campsite",
        "price_per_night": 15,
        "lat": 53.280,
        "lng": -1.760,
        "link": "https://www.derbyshirehills.co.uk",
        "features": "Shepherds huts, adult-oriented, Monsal Trail",
        "type": "tent"
    },
    {  # Upper Hurst Farm
        "name": "Upper Hurst Farm",
        "price_per_night": 31,
        "lat": 53.194,
        "lng": -1.872,
        "link": "https://www.terra-nova.co.uk/blog/best-places-to-camp/",
        "features": "Panoramic views, alpacas/peacocks, year-round",
        "type": "tent"
    }
]

# Create base map
peak_map = folium.Map(location=[53.3, -1.8], zoom_start=10, tiles='OpenStreetMap')

# Create layer groups
hike_layer = folium.FeatureGroup(name='Hiking Trails')
campsite_layer = folium.FeatureGroup(name='Campsites')

# Color gradient for hike markers
colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722']

# Add hike markers to hike layer
for hike in hikes:
    marker_size = 5 + (hike['distance_km'] / 22.5) * 15
    color_idx = min(6, int(hike['distance_km'] // 3.5))
    
    popup_html = f"""
    <b>{hike['name']}</b><br>
    <i>Distance: {hike['distance_km']} km</i><br>
    Features: {hike['features']}<br>
    <a href="{hike['link']}" target="_blank">Route Details</a>
    """
    
    folium.CircleMarker(
        location=[hike['lat'], hike['lng']],
        radius=marker_size,
        color=colors[color_idx],
        fill=True,
        fill_color=colors[color_idx],
        popup=folium.Popup(popup_html, max_width=300),
        tooltip=f"{hike['name']} ({hike['distance_km']} km)"
    ).add_to(hike_layer)

# Add campsite markers to campsite layer
for site in campsites:
    popup_html = f"""
    <b>{site['name']}</b><br>
    <i>Price: £{site['price_per_night']}/night</i><br>
    Features: {site['features']}<br>
    <a href="{site['link']}" target="_blank">Book/Info</a>
    """
    
    folium.Marker(
        location=[site['lat'], site['lng']],
        popup=folium.Popup(popup_html, max_width=250),
        icon=folium.Icon(icon="tent", prefix="fa", color="green"),
        tooltip=f"🏕️ {site['name']} (£{site['price_per_night']})"
    ).add_to(campsite_layer)

# Function to calculate approximate distance (Euclidean approximation)
def approx_distance(lat1, lng1, lat2, lng2):
    # Simple approximation for small distances
    return math.sqrt((lat2 - lat1)**2 + (lng2 - lng1)**2) * 111  # 111km per degree

# Find nearest campsites for each hike
for hike in hikes:
    nearest = None
    min_dist = float('inf')
    
    for site in campsites:
        dist = approx_distance(hike['lat'], hike['lng'], site['lat'], site['lng'])
        if dist < min_dist:
            min_dist = dist
            nearest = site
    
    if nearest and min_dist < 0.3:  # Show connections within ~33km
        folium.PolyLine(
            locations=[[hike['lat'], hike['lng']], [nearest['lat'], nearest['lng']]],
            color='gray',
            weight=1,
            dash_array='5, 5',
            tooltip=f"Nearest campsite: {nearest['name']} ({min_dist:.1f} km)"
        ).add_to(peak_map)

# Add layers to map
hike_layer.add_to(peak_map)
campsite_layer.add_to(peak_map)

# Add layer control
folium.LayerControl().add_to(peak_map)

# Add legends
legend_html = '''
<div style="position: fixed; 
            bottom: 50px; left: 50px; width: 160px; height: 210px; 
            border:2px solid grey; z-index:9999; font-size:12px;
            background-color:white; padding:10px;">
    <b>Hike Distance (km)</b><br>
    <i style="background:#4CAF50; width:15px; height:15px; 
              display:inline-block;"></i> &lt; 5<br>
    <i style="background:#8BC34A; width:15px; height:15px; 
              display:inline-block;"></i> 5-7<br>
    <i style="background:#CDDC39; width:15px; height:15px; 
              display:inline-block;"></i> 7-9<br>
    <i style="background:#FFEB3B; width:15px; height:15px; 
              display:inline-block;"></i> 9-11<br>
    <i style="background:#FFC107; width:15px; height:15px; 
              display:inline-block;"></i> 11-15<br>
    <i style="background:#FF9800; width:15px; height:15px; 
              display:inline-block;"></i> 15-20<br>
    <i style="background:#FF5722; width:15px; height:15px; 
              display:inline-block;"></i> &gt; 20<br>
    <br>
    <b>Campsites</b><br>
    <i class="fa fa-tent" style="color:green"></i> Tent site
</div>
'''
peak_map.get_root().html.add_child(folium.Element(legend_html))

# Save to HTML file
peak_map.save('peak_district_hikes_campsites.html')

print("""
Map generated successfully! 
Open 'peak_district_hikes_campsites.html' in your browser.
Features:
- Hiking trails shown with colored circle markers (size = distance)
- Campsites shown with tent icons
- Layer control to toggle visibility
- Connections to nearest campsite within 33km
- Interactive popups with details and links
""")