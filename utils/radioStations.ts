export interface RadioStation {
  id: string;
  name: string;
  callsign: string;
  frequency: string;
  location: string;
  province: string;
  streamUrl: string;
  description: string;
  genre: string;
  isVerified: boolean;
}

export const PAKISTAN_RADIO_STATIONS: RadioStation[] = [
  {
    id: 'pbc-national-islamabad',
    name: 'Radio Pakistan National',
    callsign: 'PBC-ISB',
    frequency: 'AM 1260 kHz / FM 93',
    location: 'Islamabad',
    province: 'Islamabad Capital Territory',
    streamUrl: 'https://whmsonic.radio.gov.pk:7003/stream',
    description: 'Official Pakistan Broadcasting Corporation National Flagship News Service',
    genre: 'News & Current Affairs',
    isVerified: true,
  },
  {
    id: 'fm101-islamabad',
    name: 'FM 101 Islamabad',
    callsign: 'PBC-FM101',
    frequency: 'FM 101.0 MHz',
    location: 'Islamabad',
    province: 'Islamabad Capital Territory',
    streamUrl: 'https://whmsonic.radio.gov.pk:7008/stream',
    description: 'Federal Capital Youth, Culture & Strategic Updates',
    genre: 'Current Affairs & Music',
    isVerified: true,
  },
  {
    id: 'pbc-lahore-news',
    name: 'Radio Pakistan Lahore News',
    callsign: 'PBC-LHE',
    frequency: 'AM 1332 kHz',
    location: 'Lahore',
    province: 'Punjab',
    streamUrl: 'https://whmsonic.radio.gov.pk:7004/stream',
    description: 'Punjab Regional Intelligence & Provincial News Transmission',
    genre: 'News & Analysis',
    isVerified: true,
  },
  {
    id: 'pbc-multan',
    name: 'Radio Pakistan Multan',
    callsign: 'PBC-MUX',
    frequency: 'MW 936 kHz',
    location: 'Multan',
    province: 'Punjab',
    streamUrl: 'https://whmsonic.radio.gov.pk:8034/stream',
    description: 'Southern Punjab Agricultural & Regional Bulletin Service',
    genre: 'Regional News',
    isVerified: true,
  },
  {
    id: 'fm101-karachi',
    name: 'FM 101 Karachi',
    callsign: 'PBC-KHI',
    frequency: 'FM 101.0 MHz',
    location: 'Karachi',
    province: 'Sindh',
    streamUrl: 'https://whmsonic.radio.gov.pk:8048/stream',
    description: 'Metropolitan Commercial & Arabian Sea Coastal Maritime Telemetry',
    genre: 'Urban & Marine News',
    isVerified: true,
  },
  {
    id: 'pbc-hyderabad',
    name: 'Radio Pakistan Hyderabad',
    callsign: 'PBC-HYD',
    frequency: 'MW 1008 kHz',
    location: 'Hyderabad',
    province: 'Sindh',
    streamUrl: 'https://whmsonic.radio.gov.pk:8042/stream',
    description: 'Lower Indus Basin & Regional Sindh Broadcast',
    genre: 'Provincial Bulletin',
    isVerified: true,
  },
  {
    id: 'samaa-fm-karachi',
    name: 'Samaa FM 107.4',
    callsign: 'SMA-107',
    frequency: 'FM 107.4 MHz',
    location: 'Karachi',
    province: 'Sindh',
    streamUrl: 'https://samaakhi107-itelservices.radioca.st/stream',
    description: 'Commercial Breaking News & Live Tactical Urban Updates',
    genre: 'Commercial News',
    isVerified: true,
  },
  {
    id: 'pbc-peshawar',
    name: 'Radio Pakistan Peshawar',
    callsign: 'PBC-PEW',
    frequency: 'FM 101 / MW 1251',
    location: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    streamUrl: 'https://whmsonic.radio.gov.pk:8070/relay',
    description: 'Khyber Pass Frontier & Northern Corridor Transmission',
    genre: 'Frontier Broadcast',
    isVerified: true,
  },
  {
    id: 'pbc-quetta',
    name: 'Radio Pakistan Quetta',
    callsign: 'PBC-UET',
    frequency: 'MW 756 kHz',
    location: 'Quetta',
    province: 'Balochistan',
    streamUrl: 'https://whmsonic.radio.gov.pk:8060/relay',
    description: 'Balochistan Plateau & Southwestern Strategic Highway News',
    genre: 'Regional News',
    isVerified: true,
  },
  {
    id: 'pbc-azad-kashmir',
    name: 'Radio Pakistan Azad Kashmir',
    callsign: 'PBC-AJK',
    frequency: 'MW 1026 kHz',
    location: 'Muzaffarabad / Trarkhal',
    province: 'Azad Kashmir',
    streamUrl: 'https://whmsonic.radio.gov.pk:8076/relay',
    description: 'Kashmir Valley & Line of Control Regional Transmission',
    genre: 'Highland Broadcast',
    isVerified: true,
  },
  {
    id: 'pbc-world-service',
    name: 'Radio Pakistan World Service',
    callsign: 'PBC-WS',
    frequency: 'SW Shortwave',
    location: 'Islamabad (Global)',
    province: 'Islamabad Capital Territory',
    streamUrl: 'https://whmsonic.radio.gov.pk:7005/stream',
    description: 'Strategic International & Diplomatic External Transmissions',
    genre: 'Geopolitical World Service',
    isVerified: true,
  },
];

/**
 * Returns radio stations sorted with the active province's local stations first
 */
export function getStationsForProvince(provinceName?: string | null): RadioStation[] {
  if (!provinceName) {
    return PAKISTAN_RADIO_STATIONS;
  }

  const normalized = provinceName.trim().toLowerCase();

  const matching: RadioStation[] = [];
  const others: RadioStation[] = [];

  for (const station of PAKISTAN_RADIO_STATIONS) {
    if (
      station.province.toLowerCase().includes(normalized) ||
      station.location.toLowerCase().includes(normalized)
    ) {
      matching.push(station);
    } else {
      others.push(station);
    }
  }

  return [...matching, ...others];
}

/**
 * Searches stations by name, location, frequency or callsign
 */
export function searchRadioStations(query: string): RadioStation[] {
  const q = query.trim().toLowerCase();
  if (!q) return PAKISTAN_RADIO_STATIONS;

  return PAKISTAN_RADIO_STATIONS.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.callsign.toLowerCase().includes(q) ||
    s.location.toLowerCase().includes(q) ||
    s.province.toLowerCase().includes(q) ||
    s.frequency.toLowerCase().includes(q)
  );
}
