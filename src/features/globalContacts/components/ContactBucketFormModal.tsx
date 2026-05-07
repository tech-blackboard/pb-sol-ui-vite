import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Building2, Globe } from 'lucide-react';
import { listWebsites, type SourceWebsite } from '../../../services/sourcedb';
import { createContactBucket, updateContactBucket } from '../../../services/contactBucket';
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
    const [webLoading, setWebLoading] = useState(false);

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
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setWebLoading(true);
                const ws = await listWebsites();
                if (!mounted) return;
                setWebsites(ws);
            } catch (err) {
                console.error('Failed to load websites:', err);
            } finally {
                setWebLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleChange = (field: string, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        
        // Email
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        
        // Alternative Email
        if (formData.altemail.trim() && !/\S+@\S+\.\S+/.test(formData.altemail)) {
            newErrors.altemail = 'Invalid email format';
        }

        // Name
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';

        // Organization
        if (!formData.organization.trim()) newErrors.organization = 'Organization is required';

        // Phone
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

        // WhatsApp Phone
        if (!formData.wphone.trim()) newErrors.wphone = 'WhatsApp number is required';

        // Country
        if (!formData.country) newErrors.country = 'Country is required';

        // Conference
        if (!formData.website_id) newErrors.website_id = 'Conference is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isViewMode) return;
        if (!validate()) {
            toast.error('Please fill all required fields');
            formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                website_id: Number(formData.website_id),
            };

            if (isEditMode && item?.id) {
                await updateContactBucket(item.id, payload);
                toast.success('Contact updated successfully');
            } else {
                await createContactBucket(payload);
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
                            label="Full Name*"
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
                            label="Organization*"
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
                            label="Phone*"
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
                            label="WhatsApp Phone*"
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
                                Country*
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

                    {/* Labels (view only) */}
                    {isViewMode && item?.labels && item.labels.length > 0 && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Interaction Labels</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {item.labels.map((label) => (
                                    <span
                                        key={label}
                                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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
