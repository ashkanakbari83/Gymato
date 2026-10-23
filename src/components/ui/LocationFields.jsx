// Province + city selects (the city list follows the province). `emptyLabel` adds an "all / not set" option.
import { PROVINCES, getProvince } from '../../data/locations.js';
import { useApp } from '../../context/AppContext.jsx';
import { SelectField } from './Field.jsx';

export default function LocationFields({ province, city, onChange, emptyLabel }) {
  const { lang, t } = useApp();
  const cities = getProvince(province)?.cities ?? [];
  const withEmpty = (items) => (emptyLabel ? [{ value: '', label: emptyLabel }, ...items] : items);

  return (
    <>
      <SelectField
        label={t('loc.province')}
        value={province}
        onChange={(value) => onChange({ province: value, city: '' })}
        options={withEmpty(PROVINCES.map((p) => ({ value: p.id, label: p[lang] })))}
      />
      <SelectField
        label={t('loc.city')}
        value={city}
        disabled={!province}
        onChange={(value) => onChange({ province, city: value })}
        options={withEmpty(cities.map((c) => ({ value: c.id, label: c[lang] })))}
      />
    </>
  );
}
