import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Clock, Calendar as CalendarIcon, ChevronRight, Camera, Filter } from 'lucide-react';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DateTimelineView = ({ onOpenPhoto, setToast }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = async () => {
    try {
      const data = await fetchApi('/api/photos/timeline');
      if (data.dates) {
        setTimelineData(data.dates);
        if (data.dates.length > 0) {
          setSelectedYear(data.dates[0].year);
          setSelectedMonth(data.dates[0].month);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadPhotosByDate();
    }
  }, [selectedYear, selectedMonth]);

  const loadPhotosByDate = async () => {
    try {
      setLoading(true);
      let query = `/api/photos?year=${selectedYear}`;
      if (selectedMonth) query += `&month=${selectedMonth}`;

      const res = await fetchApi(query);
      setPhotos(res.photos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique available years
  const availableYears = Array.from(new Set(timelineData.map(d => d.year)));

  // Extract available months for the selected year
  const availableMonths = timelineData
    .filter(d => d.year === selectedYear)
    .map(d => ({ month: d.month, count: d.count }));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-600" />
          Navegação por Datas e Linha do Tempo
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Explore o acervo cronologicamente organizando por Anos, Meses e Períodos
        </p>
      </div>

      {/* Year Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {availableYears.map(yr => (
          <button
            key={yr}
            onClick={() => {
              setSelectedYear(yr);
              setSelectedMonth(null);
            }}
            className={`px-5 py-2.5 rounded-2xl text-sm font-extrabold transition-all ${
              selectedYear === yr
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Ano {yr}
          </button>
        ))}
      </div>

      {/* Month Selector Accordion Buttons */}
      {selectedYear && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedMonth(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedMonth === null
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os Meses de {selectedYear}
          </button>

          {availableMonths.map(m => {
            const monthIdx = parseInt(m.month, 10) - 1;
            const monthName = MONTH_NAMES[monthIdx] || `Mês ${m.month}`;
            const isSelected = selectedMonth === m.month;
            return (
              <button
                key={m.month}
                onClick={() => setSelectedMonth(m.month)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{monthName}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-700'}`}>
                  {m.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Photo Results Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="bg-slate-200 animate-pulse aspect-[4/3] rounded-2xl"></div>)}
        </div>
      ) : photos.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm">
              Fotografias de {selectedMonth ? `${MONTH_NAMES[parseInt(selectedMonth, 10) - 1]} de ` : ''}{selectedYear} ({photos.length})
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(p => (
              <div
                key={p.id}
                onClick={() => onOpenPhoto(p, photos)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer group transition-all"
              >
                <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                  <img src={p.thumbnail_path} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-3">
                  <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{p.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhuma foto neste período</h3>
          <p className="text-xs text-slate-500">Selecione outro ano ou mês acima.</p>
        </div>
      )}
    </div>
  );
};

export default DateTimelineView;
