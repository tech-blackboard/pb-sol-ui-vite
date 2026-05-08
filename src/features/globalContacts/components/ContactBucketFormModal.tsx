import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Building2, Globe, Tag, Plus, Check } from 'lucide-react';
import { listWebsites, type SourceWebsite } from '../../../services/sourcedb';
import { createContactBucket, updateContactBucket, getContactBucketLabels, type CrmLabel } from '../../../services/contactBucket';
import type { ContactBucketItem } from '../../../services/contactBucket';
import toast from 'react-hot-toast';

const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
    'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
    'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana',
    'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon',
    'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo',
    'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica',
    'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
    'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',
    'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
    'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
    'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua',
    'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
    'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
    'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
    'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
    'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago',
    'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
    'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

type Mode = 'view' | 'add' | 'edit';

interface ContactBucketFormModalProps {
    mode: Mode;
    item?: ContactBucketItem | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ContactBucketFormModal({ mode, item, onClose, onSuccess }: ContactBucketFormModalProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [websites, setWebsites] = useState<SourceWebsite[]>([]);
    const [allLabels, setAllLabels] = useState<CrmLabel[]>([]);
    const [webLoading, setWebLoading] = useState(false);
    const [showLabelDropdown, setShowLabelDropdown] = useState(false);
    const labelDropdownRef = useRef<HTMLDivElement>(null);

    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    const [formData, setFormData] = useState({
        name: item?.name || '',
        email: item?.email || '',
        altemail: item?.altemail || '',
        phone: item?.phone || '',
        wphone: item?.wphone || '',
        organization: item?.organization || '',
        country: item?.country || '',
        website_id: item?.website?.id || '',
        notes: item?.notes || '',
        labelIds: item?.labels?.map(l => l.id) || [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setWebLoading(true);
                const [ws, ls] = await Promise.all([
                    listWebsites(),
                    getContactBucketLabels()
                ]);
                if (!mounted) return;
                setWebsites(ws);
                setAllLabels(ls);
            } catch (err) {
                console.error('Failed to load data:', err);
            } finally {
                setWebLoading(false);
            }
        })();

        // Handle outside click for label dropdown
        const handleClickOutside = (e: MouseEvent) => {
            if (labelDropdownRef.current && !labelDropdownRef.current.contains(e.target as Node)) {
                setShowLabelDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            mounted = false;
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSelectLabel = (labelId: number) => {
        const currentIds = formData.labelIds as number[];
        if (currentIds.includes(labelId)) {
            handleChange('labelIds', currentIds.filter(id => id !== labelId));
        } else {
            handleChange('labelIds', [...currentIds, labelId]);
        }
    };

    const handleClearLabels = () => {
        handleChange('labelIds', []);
        setShowLabelDropdown(false);
    };

    const validateFields = () => {
        const newErrors: Record<string, string> = {};

        // Email
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

        // Conference
        if (!formData.website_id) newErrors.website_id = 'Conference is required';

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewMode) return;
        const newErrors = validateFields();
        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fill all required fields');
            setErrors(newErrors);
            formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                website_id: Number(formData.website_id),
                labelIds: formData.labelIds,
            };

            if (isEditMode && item?.id) {
                await updateContactBucket(item.id, payload);
                toast.success('Contact updated successfully');
            } else {
                await createContactBucket(payload as any);
                toast.success('Contact created successfully');
            }
            onSuccess();
            onClose();
        } catch (err) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Operation failed';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const title = isViewMode ? 'Contact Details' : isEditMode ? 'Edit Contact' : 'Add New Contact';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh] border-2 ${Object.keys(errors).length > 0 ? 'border-red-500' : 'border-transparent'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form Body */}
                <form ref={formRef} onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Email* */}
                        <FormInput
                            label="Email*"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            placeholder="Enter email"
                            icon={<Mail className="w-4 h-4" />}
                            disabled={isViewMode}
                        />

                        {/* Alternative Email */}
                        <FormInput
                            label="Alternative Email"
                            name="altemail"
                            type="email"
                            value={formData.altemail}
                            onChange={handleChange}
                            placeholder="Enter alternative email"
                            icon={<Mail className="w-4 h-4" />}
                            disabled={isViewMode}
                        />

                        {/* Name */}
                        <FormInput
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            placeholder="Enter full name"
                            icon={<User className="w-4 h-4" />}
                            disabled={isViewMode}
                        />

                        {/* Organization */}
                        <FormInput
                            label="Organization"
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            error={errors.organization}
                            placeholder="Enter organization"
                            icon={<Building2 className="w-4 h-4" />}
                            disabled={isViewMode}
                        />

                        {/* Phone */}
                        <FormInput
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            placeholder="Enter phone number"
                            icon={<Phone className="w-4 h-4" />}
                            disabled={isViewMode}
                        />

                        {/* WhatsApp Phone */}
                        <FormInput
                            label="WhatsApp Phone"
                            name="wphone"
                            value={formData.wphone}
                            onChange={handleChange}
                            error={errors.wphone}
                            placeholder="Enter WhatsApp phone"
                            icon={<Phone className="w-4 h-4" />}
                            disabled={isViewMode}
                        />

                        {/* Country */}
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Country
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <select
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => handleChange('country', e.target.value)}
                                    disabled={isViewMode}
                                    className={`w-full px-3 py-2 rounded-lg border ${errors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none pr-10 appearance-none text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                    <option value="">Select Country</option>
                                    {COUNTRIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                        </div>

                        {/* Conference* */}
                        <div>
                            <label htmlFor="website_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Conference*
                            </label>
                            <select
                                id="website_id"
                                value={formData.website_id}
                                onChange={(e) => handleChange('website_id', e.target.value)}
                                disabled={isViewMode || webLoading}
                                className={`w-full px-3 py-2 rounded-lg border ${errors.website_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                <option value="">{webLoading ? 'Loading...' : 'Select Conference'}</option>
                                {websites.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                            {errors.website_id && <p className="text-xs text-red-500 mt-1">{errors.website_id}</p>}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="col-span-1 md:col-span-2">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            disabled={isViewMode}
                            rows={3}
                            placeholder="Add internal notes about this contact..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                        />
                    </div>

                    {/* Label Selection */}
                    <div className="col-span-1 md:col-span-2 pt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Interaction Labels
                        </label>

                        {!isViewMode ? (
                            <div className="space-y-3">
                                <div className="relative" ref={labelDropdownRef}>
                                    <div
                                        onClick={() => !isViewMode && setShowLabelDropdown(!showLabelDropdown)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm cursor-pointer hover:border-blue-500 transition-all ${isViewMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        <Tag className="w-4 h-4 text-gray-400" />
                                        <span className={`flex-1 ${formData.labelIds.length === 0 ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {formData.labelIds.length > 0 
                                                ? `${formData.labelIds.length} label(s) selected`
                                                : "Select labels..."
                                            }
                                        </span>
                                        <Plus className={`w-4 h-4 text-gray-400 transition-transform ${showLabelDropdown ? 'rotate-45' : ''}`} />
                                    </div>

                                    {showLabelDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="max-h-60 overflow-y-auto py-1">
                                                <button
                                                    type="button"
                                                    onClick={handleClearLabels}
                                                    className="w-full flex items-center px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-b border-gray-100 dark:border-gray-700"
                                                >
                                                    Clear All
                                                </button>
                                                {allLabels.length > 0 ? (
                                                    allLabels.map(l => {
                                                        const isSelected = (formData.labelIds as number[]).includes(l.id);
                                                        return (
                                                            <button
                                                                key={l.id}
                                                                type="button"
                                                                onClick={() => handleSelectLabel(l.id)}
                                                                className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${isSelected ? 'text-blue-600 font-bold bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-700 dark:text-gray-300'}`}
                                                            >
                                                                <div className="flex flex-col items-start">
                                                                    <span className="font-semibold">{l.name}</span>
                                                                    {l.description && <span className="text-[10px] opacity-60">{l.description}</span>}
                                                                </div>
                                                                {isSelected && <Check className="w-3 h-3" />}
                                                            </button>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="px-3 py-2 text-[10px] text-gray-400 italic text-center">
                                                        No labels found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Tag Display */}
                                <div className="flex flex-wrap gap-2">
                                    {(formData.labelIds as number[]).map(id => {
                                        const label = allLabels.find(l => l.id === id);
                                        if (!label) return null;
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-xs font-medium text-blue-700 dark:text-blue-300"
                                            >
                                                {label.name}
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectLabel(id)}
                                                    className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {item?.labels && item.labels.length > 0 ? (
                                    item.labels.map(l => (
                                        <span key={l.id} className="inline-flex flex-col px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{l.name}</span>
                                            {l.description && (
                                                <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70 italic">{l.description}</span>
                                            )}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-xs text-gray-400 italic">No interaction labels assigned.</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Timestamps (view mode) */}
                    {isViewMode && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                {item?.lastInteraction && (
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Last Interaction</span>
                                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                                            {new Date(item.lastInteraction).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {item?.createdAt && (
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-tight">Created At</span>
                                        <p className="text-gray-900 dark:text-gray-100 font-medium">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors text-sm"
                        >
                            {isViewMode ? 'Close' : 'Cancel'}
                        </button>
                        {!isViewMode && (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
                            >
                                {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Reusable form input ─── */
interface FormInputProps {
    label?: string;
    name: string;
    value?: string | number;
    onChange: (field: string, value: string | number) => void;
    error?: string;
    type?: string;
    icon?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
}

function FormInput({ label, name, value, onChange, error, type = 'text', icon, placeholder, disabled }: FormInputProps) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                    {icon}
                </div>
                <input
                    id={name}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(name, e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full px-3 py-2 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
                />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
