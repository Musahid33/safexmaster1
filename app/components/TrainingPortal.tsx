'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, FileText, Info, LockKeyhole, PlayCircle, X } from 'lucide-react';
import type { Site } from '@/lib/types';
import { splitTrainingCatalog, type TrainingCatalog, type TrainingMaterial } from '@/lib/training';
import { LANGUAGE_LOCALE } from '@/lib/i18n';
import { useI18n } from './I18nProvider';

type Props = {
  site: Site | null;
  /** The caller must supply only materials authorized for the current tenant and site. */
  catalog?: TrainingCatalog;
};

export default function TrainingPortal({ site, catalog = null }: Props) {
  const { language, T } = useI18n();
  const locale = LANGUAGE_LOCALE[language];
  const [material, setMaterial] = useState<TrainingMaterial | null>(null);
  const [checkMessage, setCheckMessage] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  useEffect(() => { setMaterial(null); setCheckMessage(''); setEmployeeCode(''); }, [site?.id]);
  const { videos, modules } = splitTrainingCatalog(catalog);

  function materialList(items: readonly TrainingMaterial[]) {
    return <div className="training-master-list">{items.map((item) => <button type="button" className="training-master-material" key={item.id} onClick={() => setMaterial(item)}>
      <span className="training-material-symbol">{item.type === 'video' ? <PlayCircle size={21} /> : <FileText size={21} />}</span>
      <span className="training-material-copy"><b>{item.title}</b>{item.description && <small>{item.description}</small>}<span>{item.type === 'video' ? T('Video') : item.format.toUpperCase()}{item.type === 'video' && item.durationMinutes != null && item.durationMinutes >= 0 && <> · {T('{count} minutes', { count: new Intl.NumberFormat(locale).format(item.durationMinutes) })}</>}</span></span>
      <ChevronRight size={18} aria-hidden="true" />
    </button>)}</div>;
  }

  return <section className="page-panel training-portal training-master">
    <div className="page-heading training-page-heading">
      <div><span className="eyebrow">{T('LEARN & REFRESH')} · {site?.name || T('SITE')}</span><h1>{T('Training Management')}</h1><p>{T('Browse safety learning material and check your own training status.')}</p></div>
      <BookOpen size={28} aria-hidden="true" />
    </div>
    <div className="training-preview-banner"><Info size={17} aria-hidden="true" /><span>{T('UI preview only. Training content and personal records are not connected.')}</span></div>

    <div className="training-resource-grid">
      <section className="training-master-card training-resource-card training-video-card" aria-labelledby="training-videos-title">
        <div className="training-card-header"><span className="training-card-icon training-video-icon"><PlayCircle size={22} aria-hidden="true" /></span><div><h2 id="training-videos-title">{T('Training Videos')}</h2><p>{T('Choose a video to preview')}</p></div></div>
        {catalog === null ? <div className="training-resource-empty">{T('Training videos are not connected yet.')}</div>
          : videos.length ? materialList(videos) : <div className="training-resource-empty">{T('No training videos have been published yet.')}</div>}
      </section>
      <section className="training-master-card training-resource-card training-module-card-section" aria-labelledby="training-modules-title">
        <div className="training-card-header"><span className="training-card-icon training-module-icon"><BookOpen size={22} aria-hidden="true" /></span><div><h2 id="training-modules-title">{T('Training Modules')}</h2><p>{T('PPT, PDF and image resources')}</p></div></div>
        {catalog === null ? <div className="training-resource-empty">{T('Training modules are not connected yet.')}</div>
          : modules.length ? materialList(modules) : <div className="training-resource-empty">{T('No training material has been published yet.')}</div>}
      </section>
    </div>

    <section className="training-master-card training-progress-card" aria-labelledby="training-progress-title">
      <div className="training-card-header"><span className="training-card-icon progress"><CheckCircle2 size={21} aria-hidden="true" /></span><div><h2 id="training-progress-title">{T('My Training')}</h2><p>{T('Check your personal training progress')}</p></div></div>
      <form className="training-employee-lookup" onSubmit={(event) => { event.preventDefault(); setCheckMessage(employeeCode.trim() ? 'Training lookup is not connected yet. No employee code was sent or saved.' : 'Enter your Employee Code to check training.'); }}>
        <label htmlFor="training-employee-code">{T('Employee Code')}</label>
        <div className="training-lookup-controls"><input id="training-employee-code" name="employeeCode" type="text" autoComplete="off" placeholder={T('Enter Employee Code')} value={employeeCode} required onChange={(event) => { setEmployeeCode(event.target.value); setCheckMessage(''); }} /><button type="submit" className="primary-button">{T('Check Training')}</button></div>
      </form>
      {checkMessage && <div className="training-lookup-message" role="status">{T(checkMessage)}</div>}
      <div className="training-privacy-note"><LockKeyhole size={16} aria-hidden="true" /><span>{T('Personal records will require secure verification when this feature is configured.')}</span></div>
    </section>

    {material && <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="training-material-title"><div className="modal training-material-modal"><div className="modal-header"><div><span className="eyebrow">{T('TRAINING VIEWER')} · {material.type === 'video' ? T('Video') : material.format.toUpperCase()}</span><h2 id="training-material-title">{material.title}</h2></div><button className="close-button" type="button" onClick={() => setMaterial(null)} aria-label={T('Close training viewer')}><X /></button></div>{material.description && <p>{material.description}</p>}<div className="training-material-placeholder"><FileText size={27} /><b>{T('Learning material preview')}</b><small>{T('Material viewing is not connected in this UI preview.')}</small></div><button className="secondary-button full-button" type="button" onClick={() => setMaterial(null)}>{T('Close')}</button></div></div>}
  </section>;
}
