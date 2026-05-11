import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Linking,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clubService } from '../services/clubService';

// ─── constants ────────────────────────────────────────────────────────────────

const NAVY = '#1E3A5F';
const GOLD = '#D4A017';
const BG   = '#F0F4F8';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

// Set EXPO_PUBLIC_OPENAI_API_KEY in Frontend/.env (see .env.example)
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const LEVEL_COUNTRY  = 0;
const LEVEL_STATE    = 1;
const LEVEL_DISTRICT = 2;
const LEVEL_CORP     = 3;

const TAB_LABELS = ['States', 'Districts', 'Corporations'];

// Fallback centre-points used when the ADM1 centroid is clearly wrong
// (e.g. island territories whose polygon centroid lands in the sea)
const STATE_COORDS = {
  andhrapradesh:                 { latitude: 15.9129, longitude: 79.7400 },
  arunachalpradesh:              { latitude: 28.2180, longitude: 94.7278 },
  assam:                         { latitude: 26.2006, longitude: 92.9376 },
  bihar:                         { latitude: 25.0961, longitude: 85.3131 },
  chhattisgarh:                  { latitude: 21.2787, longitude: 81.8661 },
  goa:                           { latitude: 15.2993, longitude: 74.1240 },
  gujarat:                       { latitude: 22.2587, longitude: 71.1924 },
  haryana:                       { latitude: 29.0588, longitude: 76.0856 },
  himachalpradesh:               { latitude: 31.1048, longitude: 77.1734 },
  jharkhand:                     { latitude: 23.6102, longitude: 85.2799 },
  karnataka:                     { latitude: 15.3173, longitude: 75.7139 },
  kerala:                        { latitude: 10.8505, longitude: 76.2711 },
  madhyapradesh:                 { latitude: 22.9734, longitude: 78.6569 },
  maharashtra:                   { latitude: 19.7515, longitude: 75.7139 },
  manipur:                       { latitude: 24.6637, longitude: 93.9063 },
  meghalaya:                     { latitude: 25.4670, longitude: 91.3662 },
  mizoram:                       { latitude: 23.1645, longitude: 92.9376 },
  nagaland:                      { latitude: 26.1584, longitude: 94.5624 },
  odisha:                        { latitude: 20.9517, longitude: 85.0985 },
  punjab:                        { latitude: 31.1471, longitude: 75.3412 },
  rajasthan:                     { latitude: 27.0238, longitude: 74.2179 },
  sikkim:                        { latitude: 27.5330, longitude: 88.5122 },
  tamilnadu:                     { latitude: 11.1271, longitude: 78.6569 },
  telangana:                     { latitude: 18.1124, longitude: 79.0193 },
  tripura:                       { latitude: 23.9408, longitude: 91.9882 },
  uttarpradesh:                  { latitude: 26.8467, longitude: 80.9462 },
  uttarakhand:                   { latitude: 30.0668, longitude: 79.0193 },
  westbengal:                    { latitude: 22.9868, longitude: 87.8550 },
  delhi:                         { latitude: 28.7041, longitude: 77.1025 },
  puducherry:                    { latitude: 11.9416, longitude: 79.8083 },
  chandigarh:                    { latitude: 30.7333, longitude: 76.7794 },
  ladakh:                        { latitude: 34.1526, longitude: 77.5770 },
  jammukashmir:                  { latitude: 33.7782, longitude: 76.5762 },
  andamanandnicobarislands:      { latitude: 11.7401, longitude: 92.6586 },
  lakshadweep:                   { latitude: 10.5667, longitude: 72.6417 },
};

const CORP_TYPE_COLORS = {
  'Municipal Corporation': '#1565C0',
  'Municipality':          '#2E7D32',
  'Town Panchayat':        '#6A1B9A',
  'Nagar Panchayat':       '#E65100',
  'Nagar Parishad':        '#AD1457',
};

// ─── general helpers ──────────────────────────────────────────────────────────

const normalize = v => String(v || '').toLowerCase().replace(/[^a-z]/g, '');

const getStateName    = item => item?.stateName    || item?.name || '';
const getDistrictName = item => item?.districtName || item?.name || '';
const getItemId       = item => item?.stateId || item?.districtId || item?.id;

const getLatLng = item => {
  if (item?._centroid) return item._centroid;
  const lat = Number(item?.latitude || item?.lat);
  const lng = Number(item?.longitude || item?.lng);
  return lat && lng ? { latitude: lat, longitude: lng } : null;
};

// ─── OpenAI fetch ─────────────────────────────────────────────────────────────

// Strips markdown fences and extracts the outermost JSON object from an AI response.
const safeParseAI = content => {
  if (!content) throw new Error('Empty response from OpenAI');
  let s = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const start = s.indexOf('{');
  const end   = s.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in AI response');
  return JSON.parse(s.slice(start, end + 1));
};

const fetchCorpsFromAI = async (districtName, stateName) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert on Indian municipal governance. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content:
            `List all municipal bodies in ${districtName} district, ${stateName}, India. ` +
            `Return JSON exactly: {"corporations":[{"name":string,"type":string,"ward_count":number|null,"population":number|null}]} ` +
            `where type is one of: Municipal Corporation, Municipality, Town Panchayat, Nagar Panchayat.`,
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI ${response.status}: ${body.slice(0, 120)}`);
  }
  const data   = await response.json();
  const parsed = safeParseAI(data.choices?.[0]?.message?.content);
  return parsed.corporations || parsed.municipalities || parsed.data || parsed.results || [];
};

const fetchDistrictsFromAI = async stateName => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an expert on Indian geography. Return valid JSON only.',
        },
        {
          role: 'user',
          content:
            `List every current official district in ${stateName}, India as of 2024, ` +
            `including all recently bifurcated or newly created districts (do NOT omit any). ` +
            `Return the complete list with geographic center coordinates. ` +
            `Return JSON exactly: {"districts":[{"name":string,"latitude":number,"longitude":number}]}`,
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI ${response.status}: ${body.slice(0, 120)}`);
  }
  const data   = await response.json();
  const parsed = safeParseAI(data.choices?.[0]?.message?.content);
  return (parsed.districts || []).map(d => ({
    districtName: d.name,
    districtId:   normalize(d.name),
    _centroid:    { latitude: d.latitude, longitude: d.longitude },
  }));
};

// ─── Leaflet HTML ─────────────────────────────────────────────────────────────

const LEAFLET_HTML = `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; overflow:hidden; }
    .leaflet-container { background:#e8ecf0; }
    .leaflet-div-icon  { background:transparent !important; border:none !important; }
    .poly-lbl {
      display:inline-block; background:rgba(255,255,255,0.92);
      border-radius:5px; padding:3px 7px; font-family:sans-serif;
      font-size:10px; font-weight:700; color:#1E3A5F; white-space:nowrap;
      transform:translate(-50%,-50%); position:relative; pointer-events:none;
      box-shadow:0 1px 4px rgba(0,0,0,0.28);
    }
  </style>
</head>
<body>
<div id="map"></div>
<script>
var map, polyLayer, lblLayer;
var COLORS=[
  '#E53935','#8E24AA','#1E88E5','#00897B','#F4511E',
  '#00ACC1','#43A047','#FB8C00','#3949AB','#D81B60',
  '#039BE5','#7CB342','#5E35B1','#FFB300','#C0CA33',
  '#546E7A','#FF7043','#26A69A','#EC407A','#42A5F5',
  '#6D4C41','#00BCD4','#8BC34A','#FF5722','#673AB7',
  '#9C27B0','#2196F3','#4CAF50','#FF9800','#F44336'
];
function post(o){ try{ window.ReactNativeWebView.postMessage(JSON.stringify(o)); }catch(e){} }
window.addEventListener('load',function(){ post({type:'LOADED'}); });
window.initMap = function(){
  map = L.map('map',{center:[22.97,78.66],zoom:5,zoomControl:true});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',{
    attribution:'&copy; OpenStreetMap &copy; CARTO',subdomains:'abcd',maxZoom:20
  }).addTo(map);
  polyLayer = L.layerGroup().addTo(map);
  lblLayer  = L.layerGroup().addTo(map);
  post({type:'READY'});
};
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z]/g,''); }
function addLabel(latlng,text){
  var icon=L.divIcon({className:'',html:'<span class="poly-lbl">'+esc(text)+'<\/span>',iconSize:[0,0],iconAnchor:[0,0]});
  return L.marker(latlng,{icon:icon,interactive:false,zIndexOffset:1000}).addTo(lblLayer);
}
function matchItem(items,name){
  var n=norm(name);
  for(var i=0;i<items.length;i++){
    var m=norm(items[i].label);
    if(n===m||n.indexOf(m)>=0||m.indexOf(n)>=0) return items[i];
  }
  return null;
}
window.showStateLevel = async function(items){
  polyLayer.clearLayers(); lblLayer.clearLayers();
  var ci=0;
  items.forEach(function(it){ if(it.lat!=null&&it.lng!=null) addLabel([it.lat,it.lng],it.label); });
  var gj=null;
  var CDNS=[
    'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson',
    'https://unpkg.com/@highcharts/map-collection@2.0.1/countries/in/in-all.geo.json'
  ];
  for(var u=0;u<CDNS.length;u++){
    try{ var rr=await fetch(CDNS[u]); gj=await rr.json(); if(gj&&gj.features&&gj.features.length>0) break; }catch(e){}
  }
  if(gj&&gj.features&&gj.features.length>0){
    lblLayer.clearLayers();
    gj.features.forEach(function(f){
      var nm=f.properties.ST_NM||f.properties.NAME_1||f.properties.name||'';
      var item=matchItem(items,nm);
      var color=COLORS[ci++%COLORS.length];
      var layer=L.geoJSON(f,{style:{color:'#fff',weight:1.5,fillColor:color,fillOpacity:0.65,interactive:!!item}});
      if(item){ (function(id){ layer.on('click',function(){ post({type:'NAVIGATE',level:'STATE',id:id}); }); })(item.id); }
      layer.addTo(polyLayer);
      addLabel(layer.getBounds().getCenter(),nm||(item&&item.label)||'');
    });
  } else {
    // Both CDNs failed — fetch each state polygon from Nominatim
    lblLayer.clearLayers();
    items.forEach(function(item,idx){
      var color=COLORS[ci++%COLORS.length];
      setTimeout(async function(){
        try{
          var q=encodeURIComponent(item.label+' state, India');
          var r=await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+q+'&polygon_geojson=1&polygon_threshold=0.05&limit=1',{headers:{'User-Agent':'IMEApp/1.0 nandhinik.net@gmail.com'}});
          var d=await r.json();
          if(d.length>0&&d[0].geojson){
            var layer=L.geoJSON(d[0].geojson,{style:{color:'#fff',weight:1.5,fillColor:color,fillOpacity:0.65,interactive:true}});
            var id=item.id; layer.on('click',function(){ post({type:'NAVIGATE',level:'STATE',id:id}); });
            layer.addTo(polyLayer); addLabel(layer.getBounds().getCenter(),item.label);
          }
        }catch(e){}
      },idx*300);
    });
  }
};
window.showDistrictLevel = async function(items,stateName,camLat,camLng){
  polyLayer.clearLayers(); lblLayer.clearLayers();
  if(camLat!=null&&camLng!=null) map.setView([camLat,camLng],7,{animate:true});
  // Show coordinate labels immediately while polygons load
  items.forEach(function(it){ if(it.lat!=null&&it.lng!=null) addLabel([it.lat,it.lng],it.label); });
  var gotPolygons=false;
  // One Overpass request for all district boundaries (rel[...] + map_to_area — correct syntax)
  try{
    var q='[out:geojson][timeout:60][maxsize:67108864];'+
      'rel["name"="'+stateName+'"]["admin_level"="4"]["boundary"="administrative"]->.state;'+
      'map_to_area.state->.sa;'+
      '(rel(area.sa)["admin_level"="5"]["boundary"="administrative"]["name"];'+
      'rel(area.sa)["admin_level"="6"]["boundary"="administrative"]["name"];);'+
      'out geom;';
    var r=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(q));
    var gj=await r.json();
    if(gj&&gj.features&&gj.features.length>=3){
      gotPolygons=true;
      lblLayer.clearLayers();
      var ci=0;
      gj.features.forEach(function(f){
        var nm=f.properties.name||f.properties['name:en']||'';
        var item=matchItem(items,nm);
        var color=COLORS[ci++%COLORS.length];
        var layer=L.geoJSON(f,{style:{color:'#fff',weight:1,fillColor:color,fillOpacity:0.65,interactive:!!item}});
        if(item){ (function(id){ layer.on('click',function(){ post({type:'NAVIGATE',level:'DISTRICT',id:id}); }); })(item.id); }
        layer.addTo(polyLayer);
        addLabel(layer.getBounds().getCenter(),nm||(item&&item.label)||'');
      });
    }
  }catch(e){ console.error('Overpass error:',e); }
  // Nominatim fallback: fetch per-district polygon (staggered 200 ms apart)
  if(!gotPolygons){
    items.forEach(function(item,idx){
      var color=COLORS[idx%COLORS.length];
      setTimeout(async function(){
        try{
          var q=encodeURIComponent(item.label+' district, '+stateName+', India');
          var r=await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+q+'&polygon_geojson=1&polygon_threshold=0.003&limit=1',{headers:{'User-Agent':'IMEApp/1.0 nandhinik.net@gmail.com'}});
          var d=await r.json();
          if(d.length>0&&d[0].geojson){
            var layer=L.geoJSON(d[0].geojson,{style:{color:'#fff',weight:1,fillColor:color,fillOpacity:0.65,interactive:true}});
            var id=item.id; layer.on('click',function(){ post({type:'NAVIGATE',level:'DISTRICT',id:id}); });
            layer.addTo(polyLayer); addLabel(layer.getBounds().getCenter(),item.label);
          }
        }catch(e){}
      },idx*200);
    });
  }
};
window.showCorpLevel = function(lat,lng,camLat,camLng){
  polyLayer.clearLayers(); lblLayer.clearLayers();
  if(lat!=null&&lng!=null){
    var icon=L.divIcon({className:'',html:'<div style="font-size:28px;line-height:1;transform:translate(-50%,-50%);position:relative;">&#127963;<\/div>',iconSize:[0,0],iconAnchor:[0,0]});
    L.marker([lat,lng],{icon:icon}).addTo(lblLayer);
  }
  if(camLat!=null&&camLng!=null) map.setView([camLat,camLng],10,{animate:true});
};
window.animateTo = function(lat,lng,zoom){ if(map) map.setView([lat,lng],zoom,{animate:true}); };
<\/script>
</body>
</html>`;

// ─── component ────────────────────────────────────────────────────────────────

const MunicipalMapScreen = ({ navigation }) => {
  const webViewRef  = useRef(null);
  const carouselRef = useRef(null);

  // District results cached per state: { 'tamilnadu': [districtItem, ...] }
  const districtsCacheRef = useRef({});
  // State items saved so goBack can restore them without re-fetching
  const stateItemsRef     = useRef([]);

  // Stable refs for the onWebViewMessage handler
  const itemsRef     = useRef([]);
  const drillIntoRef = useRef(null);

  const [webViewReady, setWebViewReady] = useState(false);

  const [level,            setLevel]           = useState(LEVEL_COUNTRY);
  const [items,            setItems]           = useState([]);
  const [loading,          setLoading]         = useState(true);
  const [crumbs,           setCrumbs]          = useState([]);

  const [selectedState,    setSelectedState]   = useState(null);
  const [selectedDistrict, setSelectedDistrict]= useState(null);

  const [aiCorps,       setAiCorps]      = useState([]);
  const [aiLoading,     setAiLoading]    = useState(false);
  const [carouselIndex, setCarouselIndex]= useState(0);

  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => { loadMap(); }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (level !== LEVEL_CORP || aiCorps.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex(prev => {
        const next = (prev + 1) % aiCorps.length;
        try { carouselRef.current?.scrollToIndex({ index: next, animated: true }); } catch {}
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [level, aiCorps.length]);

  useEffect(() => { setCarouselIndex(0); }, [aiCorps]);

  // ── camera (inject Leaflet JS) ────────────────────────────────────────────

  const animateTo = useCallback((lat, lng, zoom) => {
    webViewRef.current?.injectJavaScript(`window.animateTo(${lat},${lng},${zoom}); true;`);
  }, []);

  const zoomToIndia = useCallback(() => animateTo(22.9734, 78.6569, 5), [animateTo]);

  const zoomToState = useCallback(item => {
    const c = getLatLng(item) || STATE_COORDS[normalize(getStateName(item))];
    if (c) animateTo(c.latitude, c.longitude, 7);
  }, [animateTo]);

  const zoomToDistrict = useCallback(item => {
    const c = getLatLng(item);
    if (c) animateTo(c.latitude, c.longitude, 10);
  }, [animateTo]);

  // ── Leaflet layer injection ───────────────────────────────────────────────

  useEffect(() => {
    if (!webViewReady) return;

    if (level === LEVEL_STATE) {
      const stateItems = items.map(item => {
        const c = getLatLng(item) || STATE_COORDS[normalize(getStateName(item))];
        return c ? { id: String(getItemId(item)), label: getStateName(item), lat: c.latitude, lng: c.longitude } : null;
      }).filter(Boolean);
      webViewRef.current?.injectJavaScript(
        `window.showStateLevel(${JSON.stringify(stateItems)}); true;`,
      );
      return;
    }

    if (level === LEVEL_DISTRICT && selectedState) {
      const stateName = getStateName(selectedState);
      const distItems = items.map(item => {
        const c = getLatLng(item);
        return c ? { id: String(getItemId(item)), label: getDistrictName(item), lat: c.latitude, lng: c.longitude } : null;
      }).filter(Boolean);
      const cam = getLatLng(selectedState) || STATE_COORDS[normalize(stateName)];
      webViewRef.current?.injectJavaScript(
        `window.showDistrictLevel(${JSON.stringify(distItems)},${JSON.stringify(stateName)},${cam ? cam.latitude : 'null'},${cam ? cam.longitude : 'null'}); true;`,
      );
      return;
    }

    if (level === LEVEL_CORP) {
      const c = selectedDistrict ? getLatLng(selectedDistrict) : null;
      webViewRef.current?.injectJavaScript(
        `window.showCorpLevel(${c ? c.latitude : 'null'},${c ? c.longitude : 'null'},${c ? c.latitude : 'null'},${c ? c.longitude : 'null'}); true;`,
      );
    }
  }, [level, items, selectedState, selectedDistrict, webViewReady]);

  // ── WebView message handler (stable identity — reads via refs) ────────────

  const onWebViewMessage = useCallback(event => {
    let data;
    try { data = JSON.parse(event.nativeEvent.data); } catch { return; }

    if (data.type === 'LOADED') {
      webViewRef.current?.injectJavaScript(`window.initMap(); true;`);
      return;
    }
    if (data.type === 'READY') { setWebViewReady(true); return; }
    if (data.type === 'NAVIGATE') {
      const item = itemsRef.current.find(x => String(getItemId(x)) === String(data.id));
      if (item && drillIntoRef.current) drillIntoRef.current(item);
    }
  }, []);

  // ── data loaders ─────────────────────────────────────────────────────────

  const loadMap = async () => {
    setLoading(true);
    setCrumbs([]);
    setSelectedState(null);
    setSelectedDistrict(null);
    setAiCorps([]);
    zoomToIndia();

    try {
      const countriesRes = await clubService.getCountries();
      const countries    = countriesRes.success ? (countriesRes.data || []) : [];
      const india        = countries.find(c => normalize(c.countryName || c.name) === 'india');
      if (!india) throw new Error('India not found in backend');

      const statesRes = await clubService.getStatesByCountry(india.countryId);
      const states    = statesRes.success ? (statesRes.data || []) : [];

      const augmented = states.map(s => ({
        ...s,
        _centroid: STATE_COORDS[normalize(s.stateName)] || null,
      })).filter(s => s._centroid);

      stateItemsRef.current = augmented;
      setCrumbs([{ label: 'India', id: 'india' }]);
      setItems(augmented);
      setLevel(LEVEL_STATE);
    } catch (e) {
      Alert.alert('Error', `Failed to load states: ${e.message}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const drillInto = useCallback(
    async item => {
      setLoading(true);
      try {
        if (level === LEVEL_STATE) {
          const name = getStateName(item);
          setSelectedState(item);
          setSelectedDistrict(null);
          setAiCorps([]);
          setCrumbs(prev => [...prev, { label: name, id: getItemId(item) }]);
          zoomToState(item);

          const cacheKey = normalize(name);
          let districts = districtsCacheRef.current[cacheKey];
          if (!districts) {
            districts = await fetchDistrictsFromAI(name);
            districtsCacheRef.current[cacheKey] = districts;
          }
          setItems(districts);
          setLevel(LEVEL_DISTRICT);
        }

        if (level === LEVEL_DISTRICT) {
          const name = getDistrictName(item);
          setSelectedDistrict(item);
          setCrumbs(prev => [...prev, { label: name, id: getItemId(item) }]);
          zoomToDistrict(item);
          setItems([]);
          setLevel(LEVEL_CORP);
          setLoading(false);

          setAiLoading(true);
          setAiCorps([]);
          try {
            const corps = await fetchCorpsFromAI(name, getStateName(selectedState));
            setAiCorps(Array.isArray(corps) ? corps : []);
          } catch (err) {
            Alert.alert('AI Error', err.message || 'Could not fetch corporations.');
          } finally {
            setAiLoading(false);
          }
          return;
        }
      } catch (e) {
        Alert.alert('Error', `Unable to load data: ${e.message}`);
      } finally {
        setLoading(false);
      }
    },
    [level, selectedState, zoomToState, zoomToDistrict],
  );

  useEffect(() => { drillIntoRef.current = drillInto; }, [drillInto]);

  const goBack = useCallback(() => {
    if (level === LEVEL_STATE || level === LEVEL_COUNTRY) {
      navigation.goBack();
      return;
    }

    if (level === LEVEL_DISTRICT) {
      setCrumbs(prev => prev.slice(0, -1));
      setSelectedState(null);
      setSelectedDistrict(null);
      setAiCorps([]);
      setItems(stateItemsRef.current);
      setLevel(LEVEL_STATE);
      zoomToIndia();
      return;
    }

    if (level === LEVEL_CORP) {
      setCrumbs(prev => prev.slice(0, -1));
      setSelectedDistrict(null);
      setAiCorps([]);
      setLevel(LEVEL_DISTRICT);
      if (selectedState) {
        zoomToState(selectedState);
        setItems(districtsCacheRef.current[normalize(getStateName(selectedState))] || []);
      }
    }
  }, [level, selectedState, navigation, zoomToIndia, zoomToState]);

  const openGoogleMapsForCorp = corp => {
    const district = selectedDistrict ? getDistrictName(selectedDistrict) : '';
    const state    = selectedState    ? getStateName(selectedState)        : '';
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${corp.name}, ${district}, ${state}, India`)}`,
    );
  };

  // ── renderers (non-map UI unchanged) ─────────────────────────────────────

  const renderCorpCard = ({ item: corp }) => {
    const typeColor = CORP_TYPE_COLORS[corp.type] || NAVY;
    return (
      <View style={[styles.corpCard, { width: CARD_WIDTH }]}>
        <View style={styles.corpCardInner}>
          <View style={[styles.corpTypePill, { backgroundColor: typeColor + '22' }]}>
            <MaterialCommunityIcons name="office-building" size={14} color={typeColor} />
            <Text style={[styles.corpTypePillText, { color: typeColor }]}>{corp.type}</Text>
          </View>
          <Text style={styles.corpName}>{corp.name}</Text>
          <View style={styles.corpMetas}>
            {corp.ward_count != null && (
              <View style={styles.corpMetaChip}>
                <MaterialCommunityIcons name="map-marker-multiple" size={13} color={NAVY} />
                <Text style={styles.corpMetaChipText}> {corp.ward_count} Wards</Text>
              </View>
            )}
            {corp.population != null && (
              <View style={styles.corpMetaChip}>
                <MaterialCommunityIcons name="account-group" size={13} color={NAVY} />
                <Text style={styles.corpMetaChipText}> {Number(corp.population).toLocaleString()}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.corpNavBtn, { backgroundColor: typeColor }]}
            onPress={() => openGoogleMapsForCorp(corp)}
          >
            <MaterialCommunityIcons name="directions" size={15} color="#fff" />
            <Text style={styles.corpNavBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCarouselOverlay = () => {
    if (level !== LEVEL_CORP) return null;
    return (
      <View style={styles.carouselOverlay}>
        <View style={styles.carouselHeader}>
          <MaterialCommunityIcons name="office-building-marker" size={16} color={NAVY} />
          <Text style={styles.carouselTitle} numberOfLines={1}>
            {'  '}{selectedDistrict ? getDistrictName(selectedDistrict) : ''} — Corporations
          </Text>
          {aiLoading && <ActivityIndicator size="small" color={NAVY} style={{ marginLeft: 6 }} />}
          <TouchableOpacity onPress={goBack} style={{ marginLeft: 'auto', padding: 4 }}>
            <MaterialCommunityIcons name="close" size={18} color={NAVY} />
          </TouchableOpacity>
        </View>

        {aiLoading ? (
          <View style={styles.carouselLoadingBox}>
            <ActivityIndicator color={NAVY} />
            <Text style={styles.carouselLoadingText}>Fetching corporations via AI…</Text>
          </View>
        ) : aiCorps.length === 0 ? (
          <Text style={styles.carouselEmpty}>No corporations found for this district.</Text>
        ) : (
          <>
            <FlatList
              ref={carouselRef}
              data={aiCorps}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              renderItem={renderCorpCard}
              onScrollToIndexFailed={() => {}}
              onMomentumScrollEnd={e => {
                setCarouselIndex(Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH));
              }}
            />
            {aiCorps.length > 1 && (
              <View style={styles.dotRow}>
                {aiCorps.map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => {
                    carouselRef.current?.scrollToIndex({ index: i, animated: true });
                    setCarouselIndex(i);
                  }}>
                    <View style={[styles.dot, i === carouselIndex && styles.dotActive]} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const renderBottomPanel = () => {
    if (loading) return (
      <View style={styles.bottomRow}>
        <ActivityIndicator size="small" color={NAVY} />
        <Text style={styles.panelText}>  Loading…</Text>
      </View>
    );
    if (level === LEVEL_CORP) return (
      <View style={styles.bottomRow}>
        <Text style={styles.panelTitle}>
          {selectedDistrict ? getDistrictName(selectedDistrict) : 'District'}
        </Text>
        <Text style={styles.panelText}>
          {aiLoading ? 'Fetching via AI…' : `${aiCorps.length} corporation${aiCorps.length !== 1 ? 's' : ''} found`}
        </Text>
      </View>
    );
    return (
      <View style={styles.bottomRow}>
        <Text style={styles.panelTitle}>
          {`${items.length} ${level === LEVEL_STATE ? 'States' : 'Districts'} found`}
        </Text>
        <Text style={styles.panelText}>
          {level === LEVEL_STATE ? 'Tap a state label to view its districts.' : 'Tap a district label to view corporations.'}
        </Text>
      </View>
    );
  };

  const activeTab     = Math.max(0, level - 1);
  const HEADER_LABELS = ['', 'States', 'Districts', 'Corporations'];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{HEADER_LABELS[level] || 'Map'}</Text>
          {crumbs.length > 0 && (
            <Text style={styles.breadcrumb} numberOfLines={1}>
              {crumbs.map(x => x.label).join(' › ')}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={loadMap}>
          <MaterialCommunityIcons name="refresh" size={22} color={GOLD} />
        </TouchableOpacity>
      </View>

      {/* Tab strip */}
      <View style={styles.levelRow}>
        {TAB_LABELS.map((label, i) => (
          <View key={label} style={[styles.levelPill, i === activeTab && styles.levelPillActive]}>
            <Text style={[styles.levelPillText, i === activeTab && styles.levelPillTextActive]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          style={styles.map}
          source={{ html: LEAFLET_HTML }}
          onMessage={onWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          allowFileAccessFromFileURLs
          mixedContentMode="always"
        />
        {renderCarouselOverlay()}
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>{renderBottomPanel()}</View>
    </View>
  );
};

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  breadcrumb:  { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },

  levelRow: {
    flexDirection: 'row', backgroundColor: NAVY,
    paddingHorizontal: 12, paddingBottom: 12,
  },
  levelPill: {
    flex: 1, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', marginHorizontal: 3,
  },
  levelPillActive:     { backgroundColor: GOLD },
  levelPillText:       { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600' },
  levelPillTextActive: { color: NAVY },

  mapContainer: { flex: 1 },
  map:          { flex: 1 },

  carouselOverlay: {
    position: 'absolute', left: 16, right: 16, bottom: 16,
    backgroundColor: '#fff', borderRadius: 16,
    paddingTop: 14, paddingBottom: 10,
    elevation: 14,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: -2 },
  },
  carouselHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, marginBottom: 10,
  },
  carouselTitle:       { fontSize: 13, fontWeight: '700', color: NAVY, flex: 1 },
  carouselLoadingBox:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 },
  carouselLoadingText: { color: '#6B7A8D', fontSize: 12, marginLeft: 10 },
  carouselEmpty:       { color: '#6B7A8D', fontSize: 12, paddingHorizontal: 14, paddingBottom: 14 },

  corpCard:      { paddingHorizontal: 14, paddingBottom: 4 },
  corpCardInner: { backgroundColor: '#F4F6FB', borderRadius: 12, padding: 14 },
  corpTypePill:  {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  corpTypePillText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  corpName:    { fontSize: 15, fontWeight: '800', color: NAVY, marginBottom: 8 },
  corpMetas:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  corpMetaChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8EEF6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  corpMetaChipText: { fontSize: 11, color: NAVY, fontWeight: '600' },
  corpNavBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 10, paddingVertical: 8, gap: 6,
  },
  corpNavBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  dotRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 6 },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C5CDD8' },
  dotActive: { width: 18, borderRadius: 3, backgroundColor: NAVY },

  bottomPanel: {
    backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, elevation: 8,
  },
  bottomRow:  { padding: 14, flexDirection: 'row', alignItems: 'center' },
  panelTitle: { fontSize: 14, fontWeight: '700', color: NAVY },
  panelText:  { fontSize: 12, color: '#6B7A8D', marginLeft: 6 },
});

export default MunicipalMapScreen;
