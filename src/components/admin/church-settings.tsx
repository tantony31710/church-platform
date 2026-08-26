import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Church,
  Save,
  CheckCircle2,
  Building,
  User,
  Clock,
  Mail,
  Phone,
  Quote,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { useToast } from '@/lib/toast-context';
import { ChurchOrganizationSettings } from '@/lib/types';

export function ChurchSettingsManager() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<ChurchOrganizationSettings>(() =>
    DataService.getOrganizationSettings()
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = DataService.subscribe<ChurchOrganizationSettings>('organization', (fresh) => {
      setSettings(fresh);
    });
    return () => unsub();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    DataService.updateOrganizationSettings(settings);
    setSaved(true);
    showToast('Live Church Organization settings saved!');
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Church className="h-4 w-4 text-glow" />
            Live Church & Campus Profile
          </h2>
          <p className="text-xs text-foreground/50">
            Configure live church name, campus identity, service schedules, and lead pastoral staff.
          </p>
        </div>

        <Button
          type="submit"
          size="sm"
          className="gap-1.5 text-xs bg-glow text-background font-bold hover:brightness-110"
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-950" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Church Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <Church className="h-3.5 w-3.5 text-glow" />
            Church / Organization Name
          </label>
          <input
            type="text"
            value={settings.churchName}
            onChange={(e) => setSettings({ ...settings, churchName: e.target.value })}
            placeholder="e.g. Grace Community Church"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-border text-foreground text-sm focus:outline-none focus:border-glow/60"
            required
          />
        </div>

        {/* Campus Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-glow" />
            Campus / Sanctuary Location
          </label>
          <input
            type="text"
            value={settings.campusName}
            onChange={(e) => setSettings({ ...settings, campusName: e.target.value })}
            placeholder="e.g. Main Sanctuary & Community Center"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-border text-foreground text-sm focus:outline-none focus:border-glow/60"
          />
        </div>

        {/* Lead Pastor */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-purple-400" />
            Lead Pastor / Admin Name
          </label>
          <input
            type="text"
            value={settings.leadPastorName}
            onChange={(e) => setSettings({ ...settings, leadPastorName: e.target.value })}
            placeholder="e.g. Pastor David Anderson"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-border text-foreground text-sm focus:outline-none focus:border-glow/60"
          />
        </div>

        {/* Service Times */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            Worship Service Times
          </label>
          <input
            type="text"
            value={settings.serviceTimes}
            onChange={(e) => setSettings({ ...settings, serviceTimes: e.target.value })}
            placeholder="e.g. Sundays at 9:00 AM & 11:00 AM"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-border text-foreground text-sm focus:outline-none focus:border-glow/60"
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-blue-400" />
            Official Ministry Email
          </label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            placeholder="e.g. connect@gracechurch.org"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-border text-foreground text-sm focus:outline-none focus:border-glow/60"
          />
        </div>

        {/* Contact Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-emerald-400" />
            Campus Phone
          </label>
          <input
            type="text"
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            placeholder="e.g. (555) 723-4482"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-border text-foreground text-sm focus:outline-none focus:border-glow/60"
          />
        </div>

        {/* Motto */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
            <Quote className="h-3.5 w-3.5 text-glow" />
            Vision / Mission Motto
          </label>
          <input
            type="text"
            value={settings.motto}
            onChange={(e) => setSettings({ ...settings, motto: e.target.value })}
            placeholder="e.g. Serving Together with Purpose & Grace"
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-border text-foreground text-sm focus:outline-none focus:border-glow/60"
          />
        </div>
      </div>
    </form>
  );
}
