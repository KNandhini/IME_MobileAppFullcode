import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar, Linking, Alert, FlatList, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { clubService } from '../services/clubService';
import api from '../utils/api';
import { MunicipalMapScreenStyles as styles } from './screenStyles';
import { getSafeErrorMessage } from '../utils/errorHandler';

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

const KNOWN_DISTRICTS = {
  andhrapradesh: [
    { name: 'Alluri Sitharama Raju', lat: 17.9800, lng: 82.4200 },
    { name: 'Anakapalli',            lat: 17.6910, lng: 83.0050 },
    { name: 'Ananthapuramu',         lat: 14.6819, lng: 77.6006 },
    { name: 'Annamayya',             lat: 13.8800, lng: 79.0500 },
    { name: 'Bapatla',               lat: 15.9050, lng: 80.4680 },
    { name: 'Chittoor',              lat: 13.2172, lng: 79.1003 },
    { name: 'Dr. B.R. Ambedkar Konaseema', lat: 16.9174, lng: 81.7300 },
    { name: 'East Godavari',         lat: 17.0005, lng: 81.7800 },
    { name: 'Eluru',                 lat: 16.7107, lng: 81.0952 },
    { name: 'Guntur',                lat: 16.3067, lng: 80.4365 },
    { name: 'Kakinada',              lat: 16.9891, lng: 82.2475 },
    { name: 'Krishna',               lat: 16.6100, lng: 80.7200 },
    { name: 'Kurnool',               lat: 15.8281, lng: 78.0373 },
    { name: 'Manyam',                lat: 18.3200, lng: 83.4500 },
    { name: 'N T Rama Rao',          lat: 16.5100, lng: 80.6300 },
    { name: 'Nandyal',               lat: 15.4786, lng: 78.4836 },
    { name: 'Nellore',               lat: 14.4426, lng: 79.9865 },
    { name: 'Palnadu',               lat: 16.3300, lng: 79.5300 },
    { name: 'Prakasam',              lat: 15.3400, lng: 79.5000 },
    { name: 'Sri Potti Sriramulu Nellore', lat: 14.4500, lng: 79.9900 },
    { name: 'Sri Sathya Sai',        lat: 14.1600, lng: 77.8200 },
    { name: 'Srikakulam',            lat: 18.2949, lng: 83.8938 },
    { name: 'Tirupati',              lat: 13.6288, lng: 79.4192 },
    { name: 'Visakhapatnam',         lat: 17.6868, lng: 83.2185 },
    { name: 'Vizianagaram',          lat: 18.1066, lng: 83.3956 },
    { name: 'West Godavari',         lat: 16.9174, lng: 81.3340 },
    { name: 'YSR Kadapa',            lat: 14.4673, lng: 78.8242 },
  ],
  arunachalpradesh: [
    { name: 'Anjaw',            lat: 28.0800, lng: 97.0300 },
    { name: 'Changlang',        lat: 27.1200, lng: 95.9000 },
    { name: 'Dibang Valley',    lat: 28.7200, lng: 95.9400 },
    { name: 'East Kameng',      lat: 27.2300, lng: 93.1000 },
    { name: 'East Siang',       lat: 28.0600, lng: 95.3000 },
    { name: 'Itanagar',         lat: 27.0844, lng: 93.6053 },
    { name: 'Kamle',            lat: 28.0200, lng: 94.6100 },
    { name: 'Kra Daadi',        lat: 28.1000, lng: 93.9800 },
    { name: 'Kurung Kumey',     lat: 27.9400, lng: 93.5200 },
    { name: 'Lepa Rada',        lat: 27.9600, lng: 94.7100 },
    { name: 'Lohit',            lat: 28.0000, lng: 96.4000 },
    { name: 'Longding',         lat: 27.1000, lng: 95.4800 },
    { name: 'Lower Dibang Valley', lat: 28.1000, lng: 95.6800 },
    { name: 'Lower Siang',      lat: 28.1200, lng: 94.6500 },
    { name: 'Lower Subansiri',  lat: 27.4700, lng: 93.9500 },
    { name: 'Namsai',           lat: 27.6800, lng: 95.8300 },
    { name: 'Pakke Kessang',    lat: 27.2000, lng: 93.3600 },
    { name: 'Papum Pare',       lat: 27.1000, lng: 93.7000 },
    { name: 'Shi Yomi',         lat: 28.7800, lng: 94.6400 },
    { name: 'Siang',            lat: 28.2200, lng: 95.0000 },
    { name: 'Tawang',           lat: 27.5859, lng: 91.8595 },
    { name: 'Tirap',            lat: 26.9800, lng: 95.5600 },
    { name: 'Upper Dibang Valley', lat: 28.5000, lng: 96.0000 },
    { name: 'Upper Siang',      lat: 28.5000, lng: 95.0500 },
    { name: 'Upper Subansiri',  lat: 28.0000, lng: 94.2000 },
    { name: 'West Kameng',      lat: 27.3200, lng: 92.4500 },
    { name: 'West Siang',       lat: 28.1300, lng: 94.3000 },
  ],
  assam: [
    { name: 'Bajali',           lat: 26.3700, lng: 90.6700 },
    { name: 'Barpeta',          lat: 26.3200, lng: 91.0000 },
    { name: 'Biswanath',        lat: 26.7300, lng: 93.1700 },
    { name: 'Bongaigaon',       lat: 26.4800, lng: 90.5600 },
    { name: 'Cachar',           lat: 24.8100, lng: 92.8400 },
    { name: 'Charaideo',        lat: 27.0000, lng: 94.8000 },
    { name: 'Chirang',          lat: 26.4800, lng: 90.3700 },
    { name: 'Darrang',          lat: 26.4500, lng: 92.1800 },
    { name: 'Dhemaji',          lat: 27.4800, lng: 94.5600 },
    { name: 'Dhubri',           lat: 26.0200, lng: 89.9800 },
    { name: 'Dibrugarh',        lat: 27.4728, lng: 94.9120 },
    { name: 'Dima Hasao',       lat: 25.5400, lng: 93.0600 },
    { name: 'Goalpara',         lat: 26.1700, lng: 90.6200 },
    { name: 'Golaghat',         lat: 26.5200, lng: 93.9700 },
    { name: 'Hailakandi',       lat: 24.6800, lng: 92.5600 },
    { name: 'Hojai',            lat: 26.0000, lng: 92.8500 },
    { name: 'Jorhat',           lat: 26.7509, lng: 94.2037 },
    { name: 'Kamrup',           lat: 26.0900, lng: 91.4100 },
    { name: 'Kamrup Metropolitan', lat: 26.1445, lng: 91.7362 },
    { name: 'Karbi Anglong',    lat: 26.0600, lng: 93.5500 },
    { name: 'Karimganj',        lat: 24.8700, lng: 92.3500 },
    { name: 'Kokrajhar',        lat: 26.4000, lng: 90.2700 },
    { name: 'Lakhimpur',        lat: 27.2400, lng: 94.1000 },
    { name: 'Majuli',           lat: 26.9500, lng: 94.1700 },
    { name: 'Morigaon',         lat: 26.2500, lng: 92.3400 },
    { name: 'Nagaon',           lat: 26.3500, lng: 92.6800 },
    { name: 'Nalbari',          lat: 26.4300, lng: 91.4400 },
    { name: 'Sivasagar',        lat: 26.9800, lng: 94.6400 },
    { name: 'Sonitpur',         lat: 26.7300, lng: 92.8000 },
    { name: 'South Salmara-Mankachar', lat: 25.9100, lng: 89.9700 },
    { name: 'Tinsukia',         lat: 27.4900, lng: 95.3600 },
    { name: 'Udalguri',         lat: 26.7500, lng: 92.1000 },
    { name: 'West Karbi Anglong', lat: 25.9000, lng: 92.8000 },
  ],
  bihar: [
    { name: 'Araria',           lat: 26.1500, lng: 87.4700 },
    { name: 'Arwal',            lat: 25.2400, lng: 84.6800 },
    { name: 'Aurangabad',       lat: 24.7500, lng: 84.3700 },
    { name: 'Banka',            lat: 24.8800, lng: 86.9200 },
    { name: 'Begusarai',        lat: 25.4200, lng: 86.1300 },
    { name: 'Bhagalpur',        lat: 25.2425, lng: 86.9842 },
    { name: 'Bhojpur',          lat: 25.5700, lng: 84.4400 },
    { name: 'Buxar',            lat: 25.5600, lng: 83.9800 },
    { name: 'Darbhanga',        lat: 26.1542, lng: 85.8918 },
    { name: 'East Champaran',   lat: 26.6500, lng: 84.9200 },
    { name: 'Gaya',             lat: 24.7955, lng: 85.0002 },
    { name: 'Gopalganj',        lat: 26.4700, lng: 84.4400 },
    { name: 'Jamui',            lat: 24.9200, lng: 86.2300 },
    { name: 'Jehanabad',        lat: 25.2100, lng: 84.9900 },
    { name: 'Kaimur',           lat: 25.0500, lng: 83.6000 },
    { name: 'Katihar',          lat: 25.5400, lng: 87.5600 },
    { name: 'Khagaria',         lat: 25.5000, lng: 86.4700 },
    { name: 'Kishanganj',       lat: 26.1000, lng: 87.9400 },
    { name: 'Lakhisarai',       lat: 25.1700, lng: 86.1000 },
    { name: 'Madhepura',        lat: 25.9200, lng: 86.8000 },
    { name: 'Madhubani',        lat: 26.3600, lng: 86.0700 },
    { name: 'Munger',           lat: 25.3700, lng: 86.4700 },
    { name: 'Muzaffarpur',      lat: 26.1209, lng: 85.3647 },
    { name: 'Nalanda',          lat: 25.1100, lng: 85.4400 },
    { name: 'Nawada',           lat: 24.8800, lng: 85.5400 },
    { name: 'Patna',            lat: 25.5941, lng: 85.1376 },
    { name: 'Purnia',           lat: 25.7700, lng: 87.4700 },
    { name: 'Rohtas',           lat: 24.9700, lng: 83.9400 },
    { name: 'Saharsa',          lat: 25.8800, lng: 86.6000 },
    { name: 'Samastipur',       lat: 25.8600, lng: 85.7800 },
    { name: 'Saran',            lat: 25.9200, lng: 84.8700 },
    { name: 'Sheikhpura',       lat: 25.1400, lng: 85.8500 },
    { name: 'Sheohar',          lat: 26.5200, lng: 85.2900 },
    { name: 'Sitamarhi',        lat: 26.5900, lng: 85.4900 },
    { name: 'Siwan',            lat: 26.2200, lng: 84.3600 },
    { name: 'Supaul',           lat: 26.1200, lng: 86.6000 },
    { name: 'Vaishali',         lat: 25.6800, lng: 85.2200 },
    { name: 'West Champaran',   lat: 27.1000, lng: 84.3700 },
  ],
  chhattisgarh: [
    { name: 'Balod',            lat: 20.7300, lng: 81.2000 },
    { name: 'Baloda Bazar',     lat: 21.6600, lng: 82.1700 },
    { name: 'Balrampur',        lat: 23.1200, lng: 83.5800 },
    { name: 'Bastar',           lat: 19.0700, lng: 81.9500 },
    { name: 'Bemetara',         lat: 21.7000, lng: 81.5400 },
    { name: 'Bijapur',          lat: 18.8300, lng: 80.8000 },
    { name: 'Bilaspur',         lat: 22.0796, lng: 82.1391 },
    { name: 'Dantewada',        lat: 18.8900, lng: 81.3500 },
    { name: 'Dhamtari',         lat: 20.7100, lng: 81.5500 },
    { name: 'Durg',             lat: 21.1900, lng: 81.2800 },
    { name: 'Gariaband',        lat: 20.6300, lng: 82.0700 },
    { name: 'Gaurela-Pendra-Marwahi', lat: 22.7600, lng: 81.8900 },
    { name: 'Janjgir-Champa',   lat: 22.0000, lng: 82.5700 },
    { name: 'Jashpur',          lat: 22.8900, lng: 84.1400 },
    { name: 'Kabirdham',        lat: 22.0200, lng: 81.2700 },
    { name: 'Kanker',           lat: 20.2700, lng: 81.4900 },
    { name: 'Khairagarh',       lat: 21.4200, lng: 81.0000 },
    { name: 'Kondagaon',        lat: 19.5900, lng: 81.6600 },
    { name: 'Korba',            lat: 22.3595, lng: 82.7501 },
    { name: 'Koriya',           lat: 23.2300, lng: 82.6500 },
    { name: 'Mahasamund',       lat: 21.1100, lng: 82.0900 },
    { name: 'Manendragarh',     lat: 23.2000, lng: 82.2500 },
    { name: 'Mohla-Manpur',     lat: 21.0400, lng: 81.0200 },
    { name: 'Mungeli',          lat: 22.0600, lng: 81.6900 },
    { name: 'Narayanpur',       lat: 19.6900, lng: 81.2400 },
    { name: 'Raigarh',          lat: 21.8974, lng: 83.3950 },
    { name: 'Raipur',           lat: 21.2514, lng: 81.6296 },
    { name: 'Rajnandgaon',      lat: 21.0960, lng: 81.0290 },
    { name: 'Sakti',            lat: 22.0300, lng: 82.9800 },
    { name: 'Sarangarh-Bilaigarh', lat: 21.5900, lng: 83.0800 },
    { name: 'Sukma',            lat: 18.3900, lng: 81.6600 },
    { name: 'Surajpur',         lat: 23.2200, lng: 82.8700 },
    { name: 'Surguja',          lat: 23.1200, lng: 83.0000 },
  ],
  goa: [
    { name: 'North Goa', lat: 15.4989, lng: 73.8278 },
    { name: 'South Goa', lat: 15.1700, lng: 74.0900 },
  ],
  gujarat: [
    { name: 'Ahmedabad',        lat: 23.0225, lng: 72.5714 },
    { name: 'Amreli',           lat: 21.6032, lng: 71.2214 },
    { name: 'Anand',            lat: 22.5645, lng: 72.9289 },
    { name: 'Aravalli',         lat: 23.5000, lng: 73.0800 },
    { name: 'Banaskantha',      lat: 24.1700, lng: 72.4300 },
    { name: 'Bharuch',          lat: 21.7051, lng: 92.9874 },
    { name: 'Bhavnagar',        lat: 21.7645, lng: 72.1519 },
    { name: 'Botad',            lat: 22.1700, lng: 71.6600 },
    { name: 'Chhota Udaipur',   lat: 22.3000, lng: 74.0200 },
    { name: 'Dahod',            lat: 22.8346, lng: 74.2566 },
    { name: 'Dang',             lat: 20.7500, lng: 73.6900 },
    { name: 'Devbhoomi Dwarka', lat: 22.2400, lng: 69.0100 },
    { name: 'Gandhinagar',      lat: 23.2156, lng: 72.6369 },
    { name: 'Gir Somnath',      lat: 20.9000, lng: 70.3700 },
    { name: 'Jamnagar',         lat: 22.4707, lng: 70.0577 },
    { name: 'Junagadh',         lat: 21.5222, lng: 70.4579 },
    { name: 'Kheda',            lat: 22.7500, lng: 72.6800 },
    { name: 'Kutch',            lat: 23.7337, lng: 69.8597 },
    { name: 'Mahisagar',        lat: 23.0600, lng: 73.4500 },
    { name: 'Mehsana',          lat: 23.5979, lng: 72.3693 },
    { name: 'Morbi',            lat: 22.8100, lng: 70.8400 },
    { name: 'Narmada',          lat: 21.8700, lng: 73.7500 },
    { name: 'Navsari',          lat: 20.9467, lng: 72.9520 },
    { name: 'Panchmahal',       lat: 22.7600, lng: 73.5900 },
    { name: 'Patan',            lat: 23.8493, lng: 72.1266 },
    { name: 'Porbandar',        lat: 21.6425, lng: 69.6293 },
    { name: 'Rajkot',           lat: 22.3039, lng: 70.8022 },
    { name: 'Sabarkantha',      lat: 23.5900, lng: 73.0300 },
    { name: 'Surat',            lat: 21.1702, lng: 72.8311 },
    { name: 'Surendranagar',    lat: 22.7269, lng: 71.6476 },
    { name: 'Tapi',             lat: 21.1200, lng: 73.4100 },
    { name: 'Vadodara',         lat: 22.3072, lng: 73.1812 },
    { name: 'Valsad',           lat: 20.6000, lng: 72.9300 },
  ],
  haryana: [
    { name: 'Ambala',           lat: 30.3782, lng: 76.7767 },
    { name: 'Bhiwani',          lat: 28.7975, lng: 76.1322 },
    { name: 'Charkhi Dadri',    lat: 28.5900, lng: 76.2700 },
    { name: 'Faridabad',        lat: 28.4089, lng: 77.3178 },
    { name: 'Fatehabad',        lat: 29.5200, lng: 75.4500 },
    { name: 'Gurugram',         lat: 28.4595, lng: 77.0266 },
    { name: 'Hisar',            lat: 29.1492, lng: 75.7217 },
    { name: 'Jhajjar',          lat: 28.6100, lng: 76.6500 },
    { name: 'Jind',             lat: 29.3200, lng: 76.3200 },
    { name: 'Kaithal',          lat: 29.8014, lng: 76.3991 },
    { name: 'Karnal',           lat: 29.6857, lng: 76.9905 },
    { name: 'Kurukshetra',      lat: 29.9695, lng: 76.8783 },
    { name: 'Mahendragarh',     lat: 28.2800, lng: 76.1500 },
    { name: 'Mewat',            lat: 28.1100, lng: 77.0000 },
    { name: 'Palwal',           lat: 28.1400, lng: 77.3200 },
    { name: 'Panchkula',        lat: 30.6942, lng: 76.8606 },
    { name: 'Panipat',          lat: 29.3909, lng: 76.9635 },
    { name: 'Rewari',           lat: 28.1800, lng: 76.6200 },
    { name: 'Rohtak',           lat: 28.8955, lng: 76.6066 },
    { name: 'Sirsa',            lat: 29.5330, lng: 75.0316 },
    { name: 'Sonipat',          lat: 28.9931, lng: 77.0151 },
    { name: 'Yamunanagar',      lat: 30.1290, lng: 77.2674 },
  ],
  himachalpradesh: [
    { name: 'Bilaspur',         lat: 31.3400, lng: 76.7600 },
    { name: 'Chamba',           lat: 32.5531, lng: 76.1241 },
    { name: 'Hamirpur',         lat: 31.6800, lng: 76.5200 },
    { name: 'Kangra',           lat: 32.0998, lng: 76.2691 },
    { name: 'Kinnaur',          lat: 31.5900, lng: 78.4400 },
    { name: 'Kullu',            lat: 31.9600, lng: 77.1100 },
    { name: 'Lahaul and Spiti', lat: 32.5700, lng: 77.4500 },
    { name: 'Mandi',            lat: 31.7080, lng: 76.9318 },
    { name: 'Shimla',           lat: 31.1048, lng: 77.1734 },
    { name: 'Sirmaur',          lat: 30.5500, lng: 77.6000 },
    { name: 'Solan',            lat: 30.9045, lng: 77.0967 },
    { name: 'Una',              lat: 31.4700, lng: 76.2700 },
  ],
  jharkhand: [
    { name: 'Bokaro',           lat: 23.6693, lng: 86.1511 },
    { name: 'Chatra',           lat: 24.2100, lng: 84.8800 },
    { name: 'Deoghar',          lat: 24.4800, lng: 86.7000 },
    { name: 'Dhanbad',          lat: 23.7957, lng: 86.4304 },
    { name: 'Dumka',            lat: 24.2700, lng: 87.2500 },
    { name: 'East Singhbhum',   lat: 22.8046, lng: 86.2029 },
    { name: 'Garhwa',           lat: 24.1600, lng: 83.8100 },
    { name: 'Giridih',          lat: 24.1900, lng: 86.3000 },
    { name: 'Godda',            lat: 24.8300, lng: 87.2100 },
    { name: 'Gumla',            lat: 23.0400, lng: 84.5400 },
    { name: 'Hazaribagh',       lat: 23.9925, lng: 85.3637 },
    { name: 'Jamtara',          lat: 23.9600, lng: 86.8000 },
    { name: 'Khunti',           lat: 23.0700, lng: 85.2800 },
    { name: 'Koderma',          lat: 24.4600, lng: 85.5900 },
    { name: 'Latehar',          lat: 23.7400, lng: 84.5000 },
    { name: 'Lohardaga',        lat: 23.4300, lng: 84.6800 },
    { name: 'Pakur',            lat: 24.6400, lng: 87.8400 },
    { name: 'Palamu',           lat: 24.0300, lng: 84.0700 },
    { name: 'Ramgarh',          lat: 23.6300, lng: 85.5100 },
    { name: 'Ranchi',           lat: 23.3441, lng: 85.3096 },
    { name: 'Sahebganj',        lat: 25.2400, lng: 87.6400 },
    { name: 'Seraikela Kharsawan', lat: 22.7900, lng: 85.9300 },
    { name: 'Simdega',          lat: 22.6200, lng: 84.5100 },
    { name: 'West Singhbhum',   lat: 22.5700, lng: 85.8200 },
  ],
  karnataka: [
    { name: 'Bagalkot',         lat: 16.1800, lng: 75.6900 },
    { name: 'Ballari',          lat: 15.1394, lng: 76.9214 },
    { name: 'Belagavi',         lat: 15.8497, lng: 74.4977 },
    { name: 'Bengaluru Rural',  lat: 13.0100, lng: 77.5700 },
    { name: 'Bengaluru Urban',  lat: 12.9716, lng: 77.5946 },
    { name: 'Bidar',            lat: 17.9104, lng: 77.5199 },
    { name: 'Chamarajanagar',   lat: 11.9200, lng: 76.9400 },
    { name: 'Chikkaballapur',   lat: 13.4300, lng: 77.7300 },
    { name: 'Chikkamagaluru',   lat: 13.3153, lng: 75.7754 },
    { name: 'Chitradurga',      lat: 14.2300, lng: 76.3900 },
    { name: 'Dakshina Kannada', lat: 12.8438, lng: 75.2479 },
    { name: 'Davanagere',       lat: 14.4644, lng: 75.9218 },
    { name: 'Dharwad',          lat: 15.4589, lng: 75.0078 },
    { name: 'Gadag',            lat: 15.4300, lng: 75.6200 },
    { name: 'Hassan',           lat: 13.0035, lng: 76.1004 },
    { name: 'Haveri',           lat: 14.7900, lng: 75.4000 },
    { name: 'Kalaburagi',       lat: 17.3297, lng: 76.8200 },
    { name: 'Kodagu',           lat: 12.4200, lng: 75.7400 },
    { name: 'Kolar',            lat: 13.1360, lng: 78.1294 },
    { name: 'Koppal',           lat: 15.3500, lng: 76.1500 },
    { name: 'Mandya',           lat: 12.5218, lng: 76.8951 },
    { name: 'Mysuru',           lat: 12.2958, lng: 76.6394 },
    { name: 'Raichur',          lat: 16.2120, lng: 77.3439 },
    { name: 'Ramanagara',       lat: 12.7200, lng: 77.2800 },
    { name: 'Shivamogga',       lat: 13.9299, lng: 75.5681 },
    { name: 'Tumakuru',         lat: 13.3379, lng: 77.1173 },
    { name: 'Udupi',            lat: 13.3409, lng: 74.7421 },
    { name: 'Uttara Kannada',   lat: 14.9700, lng: 74.5600 },
    { name: 'Vijayapura',       lat: 16.8302, lng: 75.7100 },
    { name: 'Vijayanagara',     lat: 15.1400, lng: 76.4600 },
    { name: 'Yadgir',           lat: 16.7700, lng: 77.1400 },
  ],
  kerala: [
    { name: 'Alappuzha',        lat: 9.4981,  lng: 76.3388 },
    { name: 'Ernakulam',        lat: 9.9816,  lng: 76.2999 },
    { name: 'Idukki',           lat: 9.9189,  lng: 77.1025 },
    { name: 'Kannur',           lat: 11.8745,  lng: 75.3704 },
    { name: 'Kasaragod',        lat: 12.4996,  lng: 74.9869 },
    { name: 'Kollam',           lat: 8.8932,  lng: 76.6141 },
    { name: 'Kottayam',         lat: 9.5916,  lng: 76.5222 },
    { name: 'Kozhikode',        lat: 11.2588,  lng: 75.7804 },
    { name: 'Malappuram',       lat: 11.0510,  lng: 76.0711 },
    { name: 'Palakkad',         lat: 10.7867,  lng: 76.6548 },
    { name: 'Pathanamthitta',   lat: 9.2648,  lng: 76.7870 },
    { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
    { name: 'Thrissur',         lat: 10.5276,  lng: 76.2144 },
    { name: 'Wayanad',          lat: 11.6854,  lng: 76.1320 },
  ],
  madhyapradesh: [
    { name: 'Agar Malwa',       lat: 23.7100, lng: 76.0200 },
    { name: 'Alirajpur',        lat: 22.3000, lng: 74.3600 },
    { name: 'Anuppur',          lat: 23.0900, lng: 81.6900 },
    { name: 'Ashoknagar',       lat: 24.5800, lng: 77.7200 },
    { name: 'Balaghat',         lat: 21.8100, lng: 80.1800 },
    { name: 'Barwani',          lat: 22.0300, lng: 74.9000 },
    { name: 'Betul',            lat: 21.9100, lng: 77.9000 },
    { name: 'Bhind',            lat: 26.5700, lng: 78.7900 },
    { name: 'Bhopal',           lat: 23.2599, lng: 77.4126 },
    { name: 'Burhanpur',        lat: 21.3100, lng: 76.2300 },
    { name: 'Chhatarpur',       lat: 24.9200, lng: 79.5900 },
    { name: 'Chhindwara',       lat: 22.0500, lng: 78.9400 },
    { name: 'Damoh',            lat: 23.8300, lng: 79.4400 },
    { name: 'Datia',            lat: 25.6700, lng: 78.4600 },
    { name: 'Dewas',            lat: 22.9600, lng: 76.0500 },
    { name: 'Dhar',             lat: 22.5900, lng: 75.2900 },
    { name: 'Dindori',          lat: 22.9400, lng: 81.0800 },
    { name: 'Guna',             lat: 24.6500, lng: 77.3100 },
    { name: 'Gwalior',          lat: 26.2183, lng: 78.1828 },
    { name: 'Harda',            lat: 22.3300, lng: 77.0800 },
    { name: 'Hoshangabad',      lat: 22.7500, lng: 77.7200 },
    { name: 'Indore',           lat: 22.7196, lng: 75.8577 },
    { name: 'Jabalpur',         lat: 23.1815, lng: 79.9864 },
    { name: 'Jhabua',           lat: 22.7700, lng: 74.5900 },
    { name: 'Katni',            lat: 23.8300, lng: 80.3900 },
    { name: 'Khandwa',          lat: 21.8200, lng: 76.3500 },
    { name: 'Khargone',         lat: 21.8200, lng: 75.6100 },
    { name: 'Maihar',           lat: 24.2600, lng: 80.7600 },
    { name: 'Mandla',           lat: 22.5900, lng: 80.3800 },
    { name: 'Mandsaur',         lat: 24.0800, lng: 75.0700 },
    { name: 'Morena',           lat: 26.5000, lng: 78.0000 },
    { name: 'Mauganj',          lat: 24.6600, lng: 81.1900 },
    { name: 'Narsinghpur',      lat: 22.9500, lng: 79.1900 },
    { name: 'Neemuch',          lat: 24.4700, lng: 74.8700 },
    { name: 'Niwari',           lat: 24.9800, lng: 78.7500 },
    { name: 'Pandhurna',        lat: 21.5900, lng: 78.5200 },
    { name: 'Panna',            lat: 24.7200, lng: 80.1900 },
    { name: 'Raisen',           lat: 23.3300, lng: 77.7900 },
    { name: 'Rajgarh',          lat: 23.8400, lng: 76.7200 },
    { name: 'Ratlam',           lat: 23.3300, lng: 75.0400 },
    { name: 'Rewa',             lat: 24.5300, lng: 81.3000 },
    { name: 'Sagar',            lat: 23.8388, lng: 78.7378 },
    { name: 'Satna',            lat: 24.5700, lng: 80.8300 },
    { name: 'Sehore',           lat: 23.2000, lng: 77.0900 },
    { name: 'Seoni',            lat: 22.0900, lng: 79.5300 },
    { name: 'Shahdol',          lat: 23.2900, lng: 81.3600 },
    { name: 'Shajapur',         lat: 23.4300, lng: 76.2800 },
    { name: 'Sheopur',          lat: 25.6700, lng: 76.7100 },
    { name: 'Shivpuri',         lat: 25.4300, lng: 77.6600 },
    { name: 'Sidhi',            lat: 24.4200, lng: 81.8800 },
    { name: 'Singrauli',        lat: 24.1900, lng: 82.6700 },
    { name: 'Tikamgarh',        lat: 24.7400, lng: 78.8300 },
    { name: 'Ujjain',           lat: 23.1765, lng: 75.7885 },
    { name: 'Umaria',           lat: 23.5200, lng: 80.8400 },
    { name: 'Vidisha',          lat: 23.5200, lng: 77.8100 },
  ],
  maharashtra: [
    { name: 'Ahmednagar',       lat: 19.0952, lng: 74.7496 },
    { name: 'Akola',            lat: 20.7002, lng: 77.0082 },
    { name: 'Amravati',         lat: 20.9374, lng: 77.7796 },
    { name: 'Aurangabad',       lat: 19.8762, lng: 75.3433 },
    { name: 'Beed',             lat: 18.9900, lng: 75.7600 },
    { name: 'Bhandara',         lat: 21.1700, lng: 79.6500 },
    { name: 'Buldhana',         lat: 20.5300, lng: 76.1800 },
    { name: 'Chandrapur',       lat: 19.9615, lng: 79.2961 },
    { name: 'Dhule',            lat: 20.9014, lng: 74.7749 },
    { name: 'Gadchiroli',       lat: 20.1800, lng: 80.0000 },
    { name: 'Gondia',           lat: 21.4600, lng: 80.2000 },
    { name: 'Hingoli',          lat: 19.7200, lng: 77.1500 },
    { name: 'Jalgaon',          lat: 21.0077, lng: 75.5626 },
    { name: 'Jalna',            lat: 19.8347, lng: 75.8816 },
    { name: 'Kolhapur',         lat: 16.7050, lng: 74.2433 },
    { name: 'Latur',            lat: 18.4088, lng: 76.5604 },
    { name: 'Mumbai City',      lat: 18.9388, lng: 72.8354 },
    { name: 'Mumbai Suburban',  lat: 19.1727, lng: 72.9530 },
    { name: 'Nagpur',           lat: 21.1458, lng: 79.0882 },
    { name: 'Nanded',           lat: 19.1383, lng: 77.3210 },
    { name: 'Nandurbar',        lat: 21.3700, lng: 74.2400 },
    { name: 'Nashik',           lat: 20.0059, lng: 73.7897 },
    { name: 'Osmanabad',        lat: 18.1800, lng: 76.0400 },
    { name: 'Palghar',          lat: 19.6967, lng: 72.7650 },
    { name: 'Parbhani',         lat: 19.2704, lng: 76.7747 },
    { name: 'Pune',             lat: 18.5204, lng: 73.8567 },
    { name: 'Raigad',           lat: 18.5100, lng: 73.1800 },
    { name: 'Ratnagiri',        lat: 16.9902, lng: 73.3120 },
    { name: 'Sangli',           lat: 16.8524, lng: 74.5815 },
    { name: 'Satara',           lat: 17.6805, lng: 74.0183 },
    { name: 'Sindhudurg',       lat: 16.3500, lng: 73.7300 },
    { name: 'Solapur',          lat: 17.6599, lng: 75.9064 },
    { name: 'Thane',            lat: 19.2183, lng: 72.9781 },
    { name: 'Wardha',           lat: 20.7453, lng: 78.6022 },
    { name: 'Washim',           lat: 20.1100, lng: 77.1400 },
    { name: 'Yavatmal',         lat: 20.3888, lng: 78.1204 },
  ],
  odisha: [
    { name: 'Angul',            lat: 20.8400, lng: 85.1000 },
    { name: 'Balangir',         lat: 20.7100, lng: 83.4900 },
    { name: 'Balasore',         lat: 21.4900, lng: 86.9300 },
    { name: 'Bargarh',          lat: 21.3300, lng: 83.6100 },
    { name: 'Bhadrak',          lat: 21.0500, lng: 86.5200 },
    { name: 'Boudh',            lat: 20.8400, lng: 84.3300 },
    { name: 'Cuttack',          lat: 20.4625, lng: 85.8828 },
    { name: 'Deogarh',          lat: 21.5300, lng: 84.7300 },
    { name: 'Dhenkanal',        lat: 20.6600, lng: 85.5900 },
    { name: 'Gajapati',         lat: 19.2300, lng: 84.1500 },
    { name: 'Ganjam',           lat: 19.3800, lng: 84.9900 },
    { name: 'Jagatsinghpur',    lat: 20.2600, lng: 86.1700 },
    { name: 'Jajpur',           lat: 20.8500, lng: 86.3300 },
    { name: 'Jharsuguda',       lat: 21.8500, lng: 84.0100 },
    { name: 'Kalahandi',        lat: 19.9100, lng: 83.1600 },
    { name: 'Kandhamal',        lat: 20.1100, lng: 84.2300 },
    { name: 'Kendrapara',       lat: 20.5000, lng: 86.4200 },
    { name: 'Kendujhar',        lat: 21.6500, lng: 85.5800 },
    { name: 'Khordha',          lat: 20.2000, lng: 85.6200 },
    { name: 'Koraput',          lat: 18.8100, lng: 82.7100 },
    { name: 'Malkangiri',       lat: 18.3500, lng: 81.8900 },
    { name: 'Mayurbhanj',       lat: 21.9400, lng: 86.2700 },
    { name: 'Nabarangpur',      lat: 19.2300, lng: 82.5500 },
    { name: 'Nayagarh',         lat: 20.1300, lng: 85.0900 },
    { name: 'Nuapada',          lat: 20.8000, lng: 82.5400 },
    { name: 'Puri',             lat: 19.8135, lng: 85.8312 },
    { name: 'Rayagada',         lat: 19.1700, lng: 83.4100 },
    { name: 'Sambalpur',        lat: 21.4669, lng: 83.9756 },
    { name: 'Subarnapur',       lat: 20.8600, lng: 83.9100 },
    { name: 'Sundargarh',       lat: 22.1200, lng: 84.0300 },
  ],
  punjab: [
    { name: 'Amritsar',         lat: 31.6340, lng: 74.8723 },
    { name: 'Barnala',          lat: 30.3800, lng: 75.5500 },
    { name: 'Bathinda',         lat: 30.2110, lng: 74.9455 },
    { name: 'Faridkot',         lat: 30.6700, lng: 74.7600 },
    { name: 'Fatehgarh Sahib',  lat: 30.6400, lng: 76.3900 },
    { name: 'Fazilka',          lat: 30.4000, lng: 74.0200 },
    { name: 'Ferozepur',        lat: 30.9300, lng: 74.6200 },
    { name: 'Gurdaspur',        lat: 32.0400, lng: 75.4000 },
    { name: 'Hoshiarpur',       lat: 31.5300, lng: 75.9200 },
    { name: 'Jalandhar',        lat: 31.3260, lng: 75.5762 },
    { name: 'Kapurthala',       lat: 31.3800, lng: 75.3800 },
    { name: 'Ludhiana',         lat: 30.9010, lng: 75.8573 },
    { name: 'Malerkotla',       lat: 30.5300, lng: 75.8800 },
    { name: 'Mansa',            lat: 29.9800, lng: 75.3900 },
    { name: 'Moga',             lat: 30.8200, lng: 75.1700 },
    { name: 'Mohali',           lat: 30.7046, lng: 76.7179 },
    { name: 'Muktsar',          lat: 30.4700, lng: 74.5200 },
    { name: 'Nawanshahr',       lat: 31.1200, lng: 76.1200 },
    { name: 'Pathankot',        lat: 32.2700, lng: 75.6500 },
    { name: 'Patiala',          lat: 30.3398, lng: 76.3869 },
    { name: 'Rupnagar',         lat: 30.9700, lng: 76.5200 },
    { name: 'Sangrur',          lat: 30.2500, lng: 75.8400 },
    { name: 'Tarn Taran',       lat: 31.4500, lng: 74.9300 },
  ],
  rajasthan: [
    { name: 'Ajmer',            lat: 26.4499, lng: 74.6399 },
    { name: 'Alwar',            lat: 27.5530, lng: 76.6346 },
    { name: 'Anupgarh',         lat: 29.1900, lng: 73.2100 },
    { name: 'Balotra',          lat: 25.8300, lng: 72.2400 },
    { name: 'Banswara',         lat: 23.5500, lng: 74.4400 },
    { name: 'Baran',            lat: 25.1000, lng: 76.5200 },
    { name: 'Barmer',           lat: 25.7500, lng: 71.3900 },
    { name: 'Beawar',           lat: 26.1000, lng: 74.3200 },
    { name: 'Bharatpur',        lat: 27.2152, lng: 77.4897 },
    { name: 'Bhilwara',         lat: 25.3500, lng: 74.6400 },
    { name: 'Bikaner',          lat: 28.0229, lng: 73.3119 },
    { name: 'Bundi',            lat: 25.4400, lng: 75.6400 },
    { name: 'Chittorgarh',      lat: 24.8900, lng: 74.6200 },
    { name: 'Churu',            lat: 28.3000, lng: 74.9700 },
    { name: 'Dausa',            lat: 26.8800, lng: 76.3300 },
    { name: 'Deeg',             lat: 27.4700, lng: 77.3300 },
    { name: 'Dholpur',          lat: 26.7000, lng: 77.8900 },
    { name: 'Didwana-Kuchaman', lat: 27.4000, lng: 74.5800 },
    { name: 'Dudu',             lat: 26.6700, lng: 75.6700 },
    { name: 'Dungarpur',        lat: 23.8400, lng: 73.7200 },
    { name: 'Gangapur City',    lat: 26.4800, lng: 76.7100 },
    { name: 'Hanumangarh',      lat: 29.5800, lng: 74.3300 },
    { name: 'Jaipur',           lat: 26.9124, lng: 75.7873 },
    { name: 'Jaipur Rural',     lat: 27.0000, lng: 75.5000 },
    { name: 'Jaisalmer',        lat: 26.9157, lng: 70.9083 },
    { name: 'Jalore',           lat: 25.3500, lng: 72.6200 },
    { name: 'Jhalawar',         lat: 24.5900, lng: 76.1600 },
    { name: 'Jhunjhunu',        lat: 28.1200, lng: 75.3900 },
    { name: 'Jodhpur',          lat: 26.2389, lng: 73.0243 },
    { name: 'Jodhpur Rural',    lat: 26.1000, lng: 72.9000 },
    { name: 'Karauli',          lat: 26.5000, lng: 77.0200 },
    { name: 'Kekri',            lat: 25.9900, lng: 75.1600 },
    { name: 'Kota',             lat: 25.2138, lng: 75.8648 },
    { name: 'Kotputli-Behror',  lat: 27.7000, lng: 76.2000 },
    { name: 'Nagaur',           lat: 27.2000, lng: 73.7400 },
    { name: 'Neem ka Thana',    lat: 27.7400, lng: 75.7800 },
    { name: 'Pali',             lat: 25.7700, lng: 73.3300 },
    { name: 'Phalodi',          lat: 27.1300, lng: 72.3700 },
    { name: 'Pratapgarh',       lat: 24.0300, lng: 74.7700 },
    { name: 'Rajsamand',        lat: 25.0700, lng: 73.8800 },
    { name: 'Salumbar',         lat: 24.0900, lng: 74.0200 },
    { name: 'Sanchore',         lat: 24.7500, lng: 71.7800 },
    { name: 'Sawai Madhopur',   lat: 25.9900, lng: 76.3500 },
    { name: 'Shahpura',         lat: 25.6200, lng: 74.9300 },
    { name: 'Sikar',            lat: 27.6100, lng: 75.1400 },
    { name: 'Sirohi',           lat: 24.8900, lng: 72.8600 },
    { name: 'Sri Ganganagar',   lat: 29.9200, lng: 73.8800 },
    { name: 'Tonk',             lat: 26.1700, lng: 75.8000 },
    { name: 'Udaipur',          lat: 24.5854, lng: 73.7125 },
  ],
  tamilnadu: [
    { name: 'Ariyalur',        lat: 11.1400, lng: 79.0767 },
    { name: 'Chengalpattu',    lat: 12.6921, lng: 79.9757 },
    { name: 'Chennai',         lat: 13.0827, lng: 80.2707 },
    { name: 'Coimbatore',      lat: 11.0168, lng: 76.9558 },
    { name: 'Cuddalore',       lat: 11.7480, lng: 79.7714 },
    { name: 'Dharmapuri',      lat: 12.1277, lng: 78.1580 },
    { name: 'Dindigul',        lat: 10.3624, lng: 77.9695 },
    { name: 'Erode',           lat: 11.3410, lng: 77.7172 },
    { name: 'Kallakurichi',    lat: 11.7382, lng: 78.9598 },
    { name: 'Kanchipuram',     lat: 12.8333, lng: 79.7000 },
    { name: 'Kanyakumari',     lat:  8.0883, lng: 77.5385 },
    { name: 'Karur',           lat: 10.9601, lng: 78.0766 },
    { name: 'Krishnagiri',     lat: 12.5186, lng: 78.2137 },
    { name: 'Madurai',         lat:  9.9252, lng: 78.1198 },
    { name: 'Mayiladuthurai',  lat: 11.1026, lng: 79.6530 },
    { name: 'Nagapattinam',    lat: 10.7667, lng: 79.8440 },
    { name: 'Namakkal',        lat: 11.2190, lng: 78.1674 },
    { name: 'Nilgiris',        lat: 11.4916, lng: 76.7337 },
    { name: 'Perambalur',      lat: 11.2342, lng: 78.8806 },
    { name: 'Pudukkottai',     lat: 10.3797, lng: 78.8214 },
    { name: 'Ramanathapuram',  lat:  9.3762, lng: 78.8309 },
    { name: 'Ranipet',         lat: 12.9277, lng: 79.3328 },
    { name: 'Salem',           lat: 11.6643, lng: 78.1460 },
    { name: 'Sivaganga',       lat:  9.8473, lng: 78.4801 },
    { name: 'Tenkasi',         lat:  8.9602, lng: 77.3151 },
    { name: 'Thanjavur',       lat: 10.7870, lng: 79.1378 },
    { name: 'Theni',           lat:  9.9935, lng: 77.4760 },
    { name: 'Thoothukudi',     lat:  8.7642, lng: 78.1348 },
    { name: 'Tiruchirappalli', lat: 10.7905, lng: 78.7047 },
    { name: 'Tirunelveli',     lat:  8.7139, lng: 77.7567 },
    { name: 'Tirupattur',      lat: 12.4954, lng: 78.5707 },
    { name: 'Tiruppur',        lat: 11.1075, lng: 77.3398 },
    { name: 'Tiruvallur',      lat: 13.1435, lng: 79.9083 },
    { name: 'Tiruvannamalai',  lat: 12.2253, lng: 79.0747 },
    { name: 'Tiruvarur',       lat: 10.7732, lng: 79.6367 },
    { name: 'Vellore',         lat: 12.9165, lng: 79.1325 },
    { name: 'Viluppuram',      lat: 11.9401, lng: 79.4861 },
    { name: 'Virudhunagar',    lat:  9.5769, lng: 77.9618 },
  ],
  telangana: [
    { name: 'Adilabad',         lat: 19.6641, lng: 78.5320 },
    { name: 'Bhadradri Kothagudem', lat: 17.5500, lng: 80.6200 },
    { name: 'Hanumakonda',      lat: 17.9784, lng: 79.5940 },
    { name: 'Hyderabad',        lat: 17.3850, lng: 78.4867 },
    { name: 'Jagtial',          lat: 18.7950, lng: 78.9140 },
    { name: 'Jangaon',          lat: 17.7270, lng: 79.1520 },
    { name: 'Jayashankar Bhupalpally', lat: 18.4400, lng: 79.9300 },
    { name: 'Jogulamba Gadwal', lat: 16.2330, lng: 77.8040 },
    { name: 'Kamareddy',        lat: 18.3190, lng: 78.3360 },
    { name: 'Karimnagar',       lat: 18.4386, lng: 79.1288 },
    { name: 'Khammam',          lat: 17.2473, lng: 80.1514 },
    { name: 'Komaram Bheem Asifabad', lat: 19.3600, lng: 79.2800 },
    { name: 'Mahabubabad',      lat: 17.6020, lng: 80.0130 },
    { name: 'Mahabubnagar',     lat: 16.7374, lng: 77.9850 },
    { name: 'Mancherial',       lat: 18.8720, lng: 79.4620 },
    { name: 'Medak',            lat: 18.0480, lng: 78.2750 },
    { name: 'Medchal-Malkajgiri', lat: 17.5000, lng: 78.6000 },
    { name: 'Mulugu',           lat: 18.1900, lng: 80.0600 },
    { name: 'Nagarkurnool',     lat: 16.4830, lng: 78.3270 },
    { name: 'Nalgonda',         lat: 17.0530, lng: 79.2660 },
    { name: 'Narayanpet',       lat: 16.7400, lng: 77.4900 },
    { name: 'Nirmal',           lat: 19.0970, lng: 78.3430 },
    { name: 'Nizamabad',        lat: 18.6725, lng: 78.0942 },
    { name: 'Peddapalli',       lat: 18.6150, lng: 79.3830 },
    { name: 'Rajanna Sircilla', lat: 18.3860, lng: 78.8250 },
    { name: 'Rangareddy',       lat: 17.2400, lng: 78.3500 },
    { name: 'Sangareddy',       lat: 17.6260, lng: 78.0860 },
    { name: 'Siddipet',         lat: 18.1020, lng: 78.8520 },
    { name: 'Suryapet',         lat: 17.1390, lng: 79.6230 },
    { name: 'Vikarabad',        lat: 17.3380, lng: 77.9040 },
    { name: 'Wanaparthy',       lat: 16.3620, lng: 78.0590 },
    { name: 'Warangal',         lat: 17.9784, lng: 79.5941 },
    { name: 'Yadadri Bhuvanagiri', lat: 17.5860, lng: 79.0310 },
  ],
  uttarpradesh: [
    { name: 'Agra',             lat: 27.1767, lng: 78.0081 },
    { name: 'Aligarh',         lat: 27.8974, lng: 78.0880 },
    { name: 'Ambedkar Nagar',   lat: 26.4500, lng: 82.5400 },
    { name: 'Amethi',           lat: 26.1500, lng: 81.9100 },
    { name: 'Amroha',           lat: 28.9000, lng: 78.4700 },
    { name: 'Auraiya',          lat: 26.4600, lng: 79.5100 },
    { name: 'Ayodhya',          lat: 26.7920, lng: 82.1998 },
    { name: 'Azamgarh',         lat: 26.0670, lng: 83.1840 },
    { name: 'Baghpat',          lat: 28.9400, lng: 77.2200 },
    { name: 'Bahraich',         lat: 27.5700, lng: 81.5900 },
    { name: 'Ballia',           lat: 25.7600, lng: 84.1500 },
    { name: 'Balrampur',        lat: 27.4300, lng: 82.1800 },
    { name: 'Banda',            lat: 25.4700, lng: 80.3300 },
    { name: 'Barabanki',        lat: 26.9300, lng: 81.1900 },
    { name: 'Bareilly',         lat: 28.3670, lng: 79.4300 },
    { name: 'Basti',            lat: 26.8000, lng: 82.7300 },
    { name: 'Bhadohi',          lat: 25.3900, lng: 82.5700 },
    { name: 'Bijnor',           lat: 29.3700, lng: 78.1400 },
    { name: 'Budaun',           lat: 28.0400, lng: 79.1200 },
    { name: 'Bulandshahr',      lat: 28.4100, lng: 77.8500 },
    { name: 'Chandauli',        lat: 25.2700, lng: 83.2700 },
    { name: 'Chitrakoot',       lat: 25.2000, lng: 80.8900 },
    { name: 'Deoria',           lat: 26.5000, lng: 83.7800 },
    { name: 'Etah',             lat: 27.5600, lng: 78.6600 },
    { name: 'Etawah',           lat: 26.7800, lng: 79.0200 },
    { name: 'Farrukhabad',      lat: 27.3900, lng: 79.5800 },
    { name: 'Fatehpur',         lat: 25.9300, lng: 80.8100 },
    { name: 'Firozabad',        lat: 27.1500, lng: 78.3900 },
    { name: 'Gautam Buddha Nagar', lat: 28.5700, lng: 77.3200 },
    { name: 'Ghaziabad',        lat: 28.6692, lng: 77.4538 },
    { name: 'Ghazipur',         lat: 25.5800, lng: 83.5800 },
    { name: 'Gonda',            lat: 27.1300, lng: 81.9600 },
    { name: 'Gorakhpur',        lat: 26.7606, lng: 83.3732 },
    { name: 'Hamirpur',         lat: 25.9500, lng: 80.1500 },
    { name: 'Hapur',            lat: 28.7300, lng: 77.7700 },
    { name: 'Hardoi',           lat: 27.3900, lng: 80.1300 },
    { name: 'Hathras',          lat: 27.5900, lng: 78.0500 },
    { name: 'Jalaun',           lat: 26.1500, lng: 79.3300 },
    { name: 'Jaunpur',          lat: 25.7400, lng: 82.6800 },
    { name: 'Jhansi',           lat: 25.4484, lng: 78.5685 },
    { name: 'Kannauj',          lat: 27.0500, lng: 79.9100 },
    { name: 'Kanpur Dehat',     lat: 26.4200, lng: 79.9700 },
    { name: 'Kanpur Nagar',     lat: 26.4499, lng: 80.3319 },
    { name: 'Kasganj',          lat: 27.8100, lng: 78.6400 },
    { name: 'Kaushambi',        lat: 25.5400, lng: 81.3900 },
    { name: 'Kushinagar',       lat: 26.7400, lng: 83.8900 },
    { name: 'Lakhimpur Kheri',  lat: 27.9500, lng: 80.7800 },
    { name: 'Lalitpur',         lat: 24.6900, lng: 78.4100 },
    { name: 'Lucknow',          lat: 26.8467, lng: 80.9462 },
    { name: 'Maharajganj',      lat: 27.1300, lng: 83.5500 },
    { name: 'Mahoba',           lat: 25.2900, lng: 79.8700 },
    { name: 'Mainpuri',         lat: 27.2300, lng: 79.0200 },
    { name: 'Mathura',          lat: 27.4924, lng: 77.6737 },
    { name: 'Mau',              lat: 25.9400, lng: 83.5600 },
    { name: 'Meerut',           lat: 28.9845, lng: 77.7064 },
    { name: 'Mirzapur',         lat: 25.1459, lng: 82.5690 },
    { name: 'Moradabad',        lat: 28.8386, lng: 78.7733 },
    { name: 'Muzaffarnagar',    lat: 29.4727, lng: 77.7085 },
    { name: 'Pilibhit',         lat: 28.6400, lng: 79.8000 },
    { name: 'Pratapgarh',       lat: 25.8900, lng: 81.9900 },
    { name: 'Prayagraj',        lat: 25.4358, lng: 81.8463 },
    { name: 'Rae Bareli',       lat: 26.2300, lng: 81.2400 },
    { name: 'Rampur',           lat: 28.8100, lng: 79.0200 },
    { name: 'Saharanpur',       lat: 29.9640, lng: 77.5461 },
    { name: 'Sambhal',          lat: 28.5900, lng: 78.5700 },
    { name: 'Sant Kabir Nagar', lat: 26.7800, lng: 83.0200 },
    { name: 'Shahjahanpur',     lat: 27.8800, lng: 79.9100 },
    { name: 'Shamli',           lat: 29.4500, lng: 77.3100 },
    { name: 'Shravasti',        lat: 27.5400, lng: 81.8200 },
    { name: 'Siddharthnagar',   lat: 27.2800, lng: 83.0800 },
    { name: 'Sitapur',          lat: 27.5600, lng: 80.6800 },
    { name: 'Sonbhadra',        lat: 24.6900, lng: 83.0700 },
    { name: 'Sultanpur',        lat: 26.2600, lng: 82.0700 },
    { name: 'Unnao',            lat: 26.5500, lng: 80.4900 },
    { name: 'Varanasi',         lat: 25.3176, lng: 82.9739 },
  ],
  uttarakhand: [
    { name: 'Almora',           lat: 29.5971, lng: 79.6591 },
    { name: 'Bageshwar',        lat: 29.8400, lng: 79.7700 },
    { name: 'Chamoli',          lat: 30.4000, lng: 79.3100 },
    { name: 'Champawat',        lat: 29.3300, lng: 80.0900 },
    { name: 'Dehradun',         lat: 30.3165, lng: 78.0322 },
    { name: 'Haridwar',         lat: 29.9457, lng: 78.1642 },
    { name: 'Nainital',         lat: 29.3803, lng: 79.4636 },
    { name: 'Pauri Garhwal',    lat: 30.1500, lng: 78.7800 },
    { name: 'Pithoragarh',      lat: 29.5800, lng: 80.2100 },
    { name: 'Rudraprayag',      lat: 30.2800, lng: 78.9800 },
    { name: 'Tehri Garhwal',    lat: 30.3800, lng: 78.4800 },
    { name: 'Udham Singh Nagar', lat: 29.0000, lng: 79.5100 },
    { name: 'Uttarkashi',       lat: 30.7200, lng: 78.4500 },
  ],
  westbengal: [
    { name: 'Alipurduar',       lat: 26.4900, lng: 89.5300 },
    { name: 'Bankura',          lat: 23.2300, lng: 87.0700 },
    { name: 'Birbhum',          lat: 23.8900, lng: 87.5300 },
    { name: 'Cooch Behar',      lat: 26.3200, lng: 89.4400 },
    { name: 'Dakshin Dinajpur', lat: 25.6200, lng: 88.7600 },
    { name: 'Darjeeling',       lat: 27.0360, lng: 88.2627 },
    { name: 'Hooghly',          lat: 22.9000, lng: 88.3900 },
    { name: 'Howrah',           lat: 22.5958, lng: 88.2636 },
    { name: 'Jalpaiguri',       lat: 26.5200, lng: 88.7200 },
    { name: 'Jhargram',         lat: 22.4500, lng: 86.9900 },
    { name: 'Kalimpong',        lat: 27.0600, lng: 88.4700 },
    { name: 'Kolkata',          lat: 22.5726, lng: 88.3639 },
    { name: 'Malda',            lat: 25.0000, lng: 88.1400 },
    { name: 'Murshidabad',      lat: 24.1800, lng: 88.2700 },
    { name: 'Nadia',            lat: 23.4700, lng: 88.5600 },
    { name: 'North 24 Parganas', lat: 22.8700, lng: 88.7200 },
    { name: 'Paschim Bardhaman', lat: 23.2300, lng: 87.0700 },
    { name: 'Paschim Medinipur', lat: 22.4200, lng: 87.3200 },
    { name: 'Purba Bardhaman',  lat: 23.2300, lng: 87.8600 },
    { name: 'Purba Medinipur',  lat: 22.1800, lng: 87.9100 },
    { name: 'Purulia',          lat: 23.3300, lng: 86.3600 },
    { name: 'South 24 Parganas', lat: 22.1500, lng: 88.5100 },
    { name: 'Uttar Dinajpur',   lat: 26.1200, lng: 88.2100 },
  ],
  delhi: [
    { name: 'Central Delhi',    lat: 28.6508, lng: 77.2309 },
    { name: 'East Delhi',       lat: 28.6600, lng: 77.3100 },
    { name: 'New Delhi',        lat: 28.6139, lng: 77.2090 },
    { name: 'North Delhi',      lat: 28.7200, lng: 77.2100 },
    { name: 'North East Delhi', lat: 28.6900, lng: 77.3000 },
    { name: 'North West Delhi', lat: 28.7100, lng: 77.1100 },
    { name: 'Shahdara',         lat: 28.6700, lng: 77.2900 },
    { name: 'South Delhi',      lat: 28.5400, lng: 77.2500 },
    { name: 'South East Delhi', lat: 28.5700, lng: 77.3000 },
    { name: 'South West Delhi', lat: 28.5500, lng: 77.0900 },
    { name: 'West Delhi',       lat: 28.6600, lng: 77.1000 },
  ],
  manipur: [
    { name: 'Bishnupur',        lat: 24.6300, lng: 93.7700 },
    { name: 'Chandel',          lat: 24.3200, lng: 94.0200 },
    { name: 'Churachandpur',    lat: 24.3300, lng: 93.6800 },
    { name: 'Imphal East',      lat: 24.8200, lng: 93.9400 },
    { name: 'Imphal West',      lat: 24.8400, lng: 93.9000 },
    { name: 'Jiribam',          lat: 24.8000, lng: 93.0600 },
    { name: 'Kakching',         lat: 24.4900, lng: 93.9800 },
    { name: 'Kamjong',          lat: 25.1100, lng: 94.5400 },
    { name: 'Kangpokpi',        lat: 25.1300, lng: 93.9600 },
    { name: 'Noney',            lat: 25.0200, lng: 93.7700 },
    { name: 'Pherzawl',         lat: 24.1700, lng: 93.4900 },
    { name: 'Senapati',         lat: 25.2700, lng: 94.0200 },
    { name: 'Tamenglong',       lat: 24.9800, lng: 93.5100 },
    { name: 'Tengnoupal',       lat: 24.1700, lng: 94.1700 },
    { name: 'Thoubal',          lat: 24.6400, lng: 93.9900 },
    { name: 'Ukhrul',           lat: 25.1200, lng: 94.3600 },
  ],
  meghalaya: [
    { name: 'East Garo Hills',  lat: 25.5700, lng: 90.8200 },
    { name: 'East Jaintia Hills', lat: 25.4500, lng: 92.3600 },
    { name: 'East Khasi Hills', lat: 25.5788, lng: 91.8933 },
    { name: 'Eastern West Khasi Hills', lat: 25.3000, lng: 91.5000 },
    { name: 'North Garo Hills', lat: 25.9200, lng: 90.7600 },
    { name: 'Ri Bhoi',          lat: 25.7500, lng: 92.1000 },
    { name: 'South Garo Hills', lat: 25.3300, lng: 90.4200 },
    { name: 'South West Garo Hills', lat: 25.4600, lng: 89.9600 },
    { name: 'South West Khasi Hills', lat: 25.1500, lng: 91.5300 },
    { name: 'West Garo Hills',  lat: 25.6400, lng: 90.2300 },
    { name: 'West Jaintia Hills', lat: 25.4300, lng: 92.0900 },
    { name: 'West Khasi Hills', lat: 25.5300, lng: 91.3400 },
  ],
  mizoram: [
    { name: 'Aizawl',           lat: 23.7271, lng: 92.7176 },
    { name: 'Champhai',         lat: 23.4600, lng: 93.3300 },
    { name: 'Hnahthial',        lat: 23.0400, lng: 92.9700 },
    { name: 'Khawzawl',         lat: 23.7500, lng: 93.1800 },
    { name: 'Kolasib',          lat: 24.2300, lng: 92.6800 },
    { name: 'Lawngtlai',        lat: 22.5300, lng: 92.9000 },
    { name: 'Lunglei',          lat: 22.8889, lng: 92.7350 },
    { name: 'Mamit',            lat: 23.9200, lng: 92.4800 },
    { name: 'Saiha',            lat: 22.4900, lng: 92.9700 },
    { name: 'Saitual',          lat: 23.7800, lng: 93.0500 },
    { name: 'Serchhip',         lat: 23.2900, lng: 92.8400 },
  ],
  nagaland: [
    { name: 'Chumoukedima',     lat: 25.8900, lng: 93.7800 },
    { name: 'Dimapur',          lat: 25.9044, lng: 93.7264 },
    { name: 'Kiphire',          lat: 26.2800, lng: 94.9900 },
    { name: 'Kohima',           lat: 25.6751, lng: 94.1086 },
    { name: 'Longleng',         lat: 26.5300, lng: 94.7200 },
    { name: 'Mokokchung',       lat: 26.3200, lng: 94.5200 },
    { name: 'Mon',              lat: 26.7200, lng: 95.0400 },
    { name: 'Niuland',          lat: 25.7000, lng: 93.8800 },
    { name: 'Noklak',           lat: 26.1100, lng: 95.3600 },
    { name: 'Peren',            lat: 25.5000, lng: 93.7200 },
    { name: 'Phek',             lat: 25.6600, lng: 94.4700 },
    { name: 'Shamator',         lat: 26.4500, lng: 94.6800 },
    { name: 'Tseminyu',         lat: 25.9700, lng: 94.2400 },
    { name: 'Tuensang',         lat: 26.2700, lng: 94.8300 },
    { name: 'Wokha',            lat: 26.1000, lng: 94.2600 },
    { name: 'Zunheboto',        lat: 25.9900, lng: 94.5200 },
  ],
  sikkim: [
    { name: 'Gangtok',          lat: 27.3389, lng: 88.6065 },
    { name: 'Gyalshing',        lat: 27.2900, lng: 88.2700 },
    { name: 'Mangan',           lat: 27.5100, lng: 88.5300 },
    { name: 'Namchi',           lat: 27.1600, lng: 88.3600 },
    { name: 'Pakyong',          lat: 27.2200, lng: 88.6100 },
    { name: 'Soreng',           lat: 27.2800, lng: 88.2100 },
  ],
  tripura: [
    { name: 'Dhalai',           lat: 24.0200, lng: 91.9600 },
    { name: 'Gomati',           lat: 23.4700, lng: 91.5000 },
    { name: 'Khowai',           lat: 24.0600, lng: 91.6100 },
    { name: 'North Tripura',    lat: 24.4100, lng: 92.0200 },
    { name: 'Sepahijala',       lat: 23.5400, lng: 91.3500 },
    { name: 'South Tripura',    lat: 23.2600, lng: 91.5400 },
    { name: 'Unakoti',          lat: 24.3100, lng: 92.0900 },
    { name: 'West Tripura',     lat: 23.9408, lng: 91.9882 },
  ],
  puducherry: [
    { name: 'Karaikal',         lat: 10.9254, lng: 79.8380 },
    { name: 'Mahe',             lat: 11.7014, lng: 75.5369 },
    { name: 'Puducherry',       lat: 11.9416, lng: 79.8083 },
    { name: 'Yanam',            lat: 16.7300, lng: 82.2100 },
  ],
  chandigarh: [
    { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  ],
  ladakh: [
    { name: 'Kargil', lat: 34.5539, lng: 76.1349 },
    { name: 'Leh',    lat: 34.1526, lng: 77.5770 },
  ],
  jammukashmir: [
    { name: 'Anantnag',         lat: 33.7300, lng: 75.1500 },
    { name: 'Bandipora',        lat: 34.4100, lng: 74.6500 },
    { name: 'Baramulla',        lat: 34.2100, lng: 74.3400 },
    { name: 'Budgam',           lat: 33.9300, lng: 74.7100 },
    { name: 'Doda',             lat: 33.1500, lng: 75.5500 },
    { name: 'Ganderbal',        lat: 34.2200, lng: 74.7800 },
    { name: 'Jammu',            lat: 32.7266, lng: 74.8570 },
    { name: 'Kathua',           lat: 32.3800, lng: 75.5200 },
    { name: 'Kishtwar',         lat: 33.3100, lng: 75.7700 },
    { name: 'Kulgam',           lat: 33.6400, lng: 75.0200 },
    { name: 'Kupwara',          lat: 34.5200, lng: 74.2600 },
    { name: 'Poonch',           lat: 33.7700, lng: 74.1000 },
    { name: 'Pulwama',          lat: 33.8800, lng: 74.8900 },
    { name: 'Rajouri',          lat: 33.3800, lng: 74.3000 },
    { name: 'Ramban',           lat: 33.2400, lng: 75.2300 },
    { name: 'Reasi',            lat: 33.0800, lng: 74.8300 },
    { name: 'Samba',            lat: 32.5700, lng: 75.1200 },
    { name: 'Shopian',          lat: 33.7200, lng: 74.8300 },
    { name: 'Srinagar',         lat: 34.0837, lng: 74.7973 },
    { name: 'Udhampur',         lat: 32.9200, lng: 75.1400 },
  ],
  andamanandnicobarislands: [
    { name: 'Nicobar',          lat:  7.2000, lng: 93.7400 },
    { name: 'North and Middle Andaman', lat: 12.5700, lng: 92.8500 },
    { name: 'South Andaman',    lat: 11.6234, lng: 92.7265 },
  ],
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
  const res = await api.get('/MunicipalCorp/ai-corps', {
    params:  { district: districtName, state: stateName },
    timeout: 35000,
  });
  return res.data?.data || [];
};

const fetchDistrictsFromAI = async stateName => {
  const key = normalize(stateName);
  if (KNOWN_DISTRICTS[key]) {
    return KNOWN_DISTRICTS[key].map(d => ({
      districtName: d.name,
      districtId:   normalize(d.name),
      _centroid:    { latitude: d.lat, longitude: d.lng },
    }));
  }

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
    .poly-lbl-nav {
      pointer-events:auto; cursor:pointer;
    }
    .poly-lbl-nav:active { opacity:0.7; }
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
function addNavLabel(latlng,text,level,id){
  var icon=L.divIcon({className:'',html:'<span class="poly-lbl poly-lbl-nav">'+esc(text)+'<\/span>',iconSize:[0,0],iconAnchor:[0,0]});
  var m=L.marker(latlng,{icon:icon,interactive:true,zIndexOffset:1000});
  (function(lv,nid){ m.on('click',function(){ post({type:'NAVIGATE',level:lv,id:nid}); }); })(level,id);
  m.addTo(lblLayer);
  return m;
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
  items.forEach(function(it){ if(it.lat!=null&&it.lng!=null) addNavLabel([it.lat,it.lng],it.label,'STATE',it.id); });
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
      if(item){ addNavLabel(layer.getBounds().getCenter(),(item&&item.label)||nm,'STATE',item.id); }else{ addLabel(layer.getBounds().getCenter(),nm); }
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
            layer.addTo(polyLayer); addNavLabel(layer.getBounds().getCenter(),item.label,'STATE',item.id);
          }
        }catch(e){}
      },idx*300);
    });
  }
};
window.showDistrictLevel = async function(items,stateName,camLat,camLng){
  polyLayer.clearLayers(); lblLayer.clearLayers();
  if(camLat!=null&&camLng!=null) map.setView([camLat,camLng],7,{animate:true});
  // Clickable centroid labels shown immediately; replaced when polygon loads
  var lblMarkers={};
  var ci=0;
  items.forEach(function(it){
    if(it.lat!=null&&it.lng!=null) lblMarkers[it.id]=addNavLabel([it.lat,it.lng],it.label,'DISTRICT',it.id);
  });
  function districtStyle(color){
    return {color:'#fff',weight:1.5,fillColor:color,fillOpacity:0.72,opacity:1};
  }
  function isPolyGeo(g){
    return g&&(g.type==='Polygon'||g.type==='MultiPolygon');
  }
  function placePoly(geojson,item,color){
    if(lblMarkers[item.id]){ lblLayer.removeLayer(lblMarkers[item.id]); delete lblMarkers[item.id]; }
    var layer=L.geoJSON(geojson,{style:function(){ return districtStyle(color); },interactive:true});
    (function(id){ layer.on('click',function(){ post({type:'NAVIGATE',level:'DISTRICT',id:id}); }); })(item.id);
    layer.addTo(polyLayer);
    try{ var c=layer.getBounds().getCenter(); addNavLabel([c.lat,c.lng],item.label,'DISTRICT',item.id); }catch(e){}
  }
  var gotPolygons=false;
  // ── Attempt 1: Overpass with 10 s AbortController ─────────────────────────
  try{
    var ctrl=new AbortController();
    var tid=setTimeout(function(){ ctrl.abort(); },10000);
    var q='[out:geojson][timeout:9][maxsize:16777216];'+
      'rel["name"="'+stateName+'"]["admin_level"="4"]["boundary"="administrative"]->.state;'+
      'map_to_area.state->.sa;'+
      '(rel(area.sa)["admin_level"="6"]["boundary"="administrative"]["name"];'+
      'rel(area.sa)["admin_level"="5"]["boundary"="administrative"]["name"];);'+
      'out geom;';
    var r=await fetch('https://overpass-api.de/api/interpreter?data='+encodeURIComponent(q),{signal:ctrl.signal});
    clearTimeout(tid);
    var gj=await r.json();
    var polyFeatures=(gj&&gj.features||[]).filter(function(f){
      var t=f&&f.geometry&&f.geometry.type||'';
      return t==='Polygon'||t==='MultiPolygon';
    });
    if(polyFeatures.length>=3){
      gotPolygons=true;
      polyFeatures.forEach(function(f){
        var nm=f.properties.name||f.properties['name:en']||'';
        var item=matchItem(items,nm);
        var color=COLORS[ci++%COLORS.length];
        if(item){ placePoly(f.geometry,item,color); }
      });
    }
  }catch(e){ console.error('Overpass district error:',e.message); }
  // ── Attempt 2: Nominatim forward search per district ─────────────────────
  // Labels already visible; polygons load progressively and swap in
  if(!gotPolygons){
    items.forEach(function(item,idx){
      var color=COLORS[idx%COLORS.length];
      setTimeout(async function(){
        try{
          var q=encodeURIComponent(item.label+' district, '+stateName+', India');
          var resp=await fetch(
            'https://nominatim.openstreetmap.org/search?format=json&q='+q+'&polygon_geojson=1&polygon_threshold=0.02&limit=1&addressdetails=0',
            {headers:{'User-Agent':'IMEApp/1.0 nandhinik.net@gmail.com'}}
          );
          var d=await resp.json();
          if(d.length>0&&isPolyGeo(d[0].geojson)) placePoly(d[0].geojson,item,color);
        }catch(e){}
      },idx*250);
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
      Alert.alert('Error', getSafeErrorMessage(e));
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
            console.warn('Corp fetch failed:', err.message);
            setAiCorps([]);
          } finally {
            setAiLoading(false);
          }
          return;
        }
      } catch (e) {
        Alert.alert('Error', getSafeErrorMessage(e));
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
    const districtName = selectedDistrict ? getDistrictName(selectedDistrict) : '';
    const stateName    = selectedState    ? getStateName(selectedState)        : '';

    const openDetails = () => navigation.navigate('CorpDetails', {
      corp: {
        corpName:  corp.name,
        wardCount: corp.ward_count,
        population: corp.population != null ? Number(corp.population).toLocaleString('en-IN') : null,
      },
      districtName,
      stateName,
    });

    return (
      <View style={[styles.corpCard, { width: CARD_WIDTH }]}>
        <TouchableOpacity style={styles.corpCardInner} onPress={openDetails} activeOpacity={0.85}>
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
          <View style={styles.corpBtnRow}>
            <TouchableOpacity
              style={[styles.corpNavBtn, { backgroundColor: typeColor, flex: 1 }]}
              onPress={() => openGoogleMapsForCorp(corp)}
            >
              <MaterialCommunityIcons name="directions" size={15} color="#fff" />
              <Text style={styles.corpNavBtnText}>Open in Maps</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.corpNavBtn, { backgroundColor: NAVY, flex: 1, marginLeft: 8 }]}
              onPress={openDetails}
            >
              <MaterialCommunityIcons name="information-outline" size={15} color="#fff" />
              <Text style={styles.corpNavBtnText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
          <Text style={styles.carouselEmpty}>No corporation details found for this district.</Text>
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

  const goToLogin = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation]);

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
        <TouchableOpacity onPress={loadMap} style={{ marginRight: 10 }}>
          <MaterialCommunityIcons name="refresh" size={22} color={GOLD} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginBackBtn} onPress={goToLogin}>
          <MaterialCommunityIcons name="logout" size={18} color={NAVY} />
          <Text style={styles.loginBackBtnText}>Login</Text>
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



export default MunicipalMapScreen;
