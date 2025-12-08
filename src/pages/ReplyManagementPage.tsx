import { useState, useEffect } from 'react';
import { Mail, Tag, UserX, Send, Search, RefreshCw } from 'lucide-react';

interface Event {
  id: number;
  name: string;
  replyDomain: string;
  assignedDomains: string[];
}

interface Email {
  id: number;
  eventId: number;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
  labels: string[];
  isUnsubscribed: boolean;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

const ReplyManagementCRM = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyText, setReplyText] = useState('');
  const [labelFilter, setLabelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabelModal, setShowLabelModal] = useState(false);

  const labels: Label[] = [
    { id: 'positive', name: 'Positive', color: 'bg-green-100 text-green-800' },
    { id: 'unsubscribe', name: 'Unsubscribe', color: 'bg-red-100 text-red-800' },
    { id: 'abstract', name: 'Abstract', color: 'bg-blue-100 text-blue-800' },
    { id: 'interested', name: 'Interested', color: 'bg-purple-100 text-purple-800' },
    { id: 'followup', name: 'Follow-up', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'speaker', name: 'Speaker', color: 'bg-indigo-100 text-indigo-800' }
  ];

  // Initialize demo data
  useEffect(() => {
    const demoEvents: Event[] = [
      {
        id: 1,
        name: 'Addiction Conference 2025',
        replyDomain: 'precisionglobalconferences.com',
        assignedDomains: ['domain1.com', 'domain2.com', 'domain3.com']
      },
      {
        id: 2,
        name: 'Healthcare Summit 2025',
        replyDomain: 'precisionglobalconferences.com',
        assignedDomains: ['domain4.com', 'domain5.com']
      }
    ];

    const demoEmails: Email[] = [
      {
        id: 1,
        eventId: 1,
        from: 'john.doe@domain1.com',
        subject: 'Interested in attending',
        body: 'I would like to know more about the conference agenda.',
        receivedAt: '2025-12-08T10:30:00',
        labels: [],
        isUnsubscribed: false
      },
      {
        id: 2,
        eventId: 1,
        from: 'jane.smith@domain2.com',
        subject: 'Abstract submission',
        body: 'I would like to submit an abstract for the conference.',
        receivedAt: '2025-12-08T09:15:00',
        labels: ['abstract'],
        isUnsubscribed: false
      },
      {
        id: 3,
        eventId: 1,
        from: 'bob.johnson@domain3.com',
        subject: 'Please remove me',
        body: 'I no longer wish to receive emails about this event.',
        receivedAt: '2025-12-08T08:45:00',
        labels: ['unsubscribe'],
        isUnsubscribed: true
      }
    ];

    setEvents(demoEvents);
    setEmails(demoEmails);
    setSelectedEvent(demoEvents[0]);
  }, []);

  const getEventEmails = (): Email[] => {
    if (!selectedEvent) return [];
    
    let filtered = emails.filter(e => e.eventId === selectedEvent.id);
    
    if (labelFilter !== 'all') {
      filtered = filtered.filter(e => e.labels.includes(labelFilter));
    }
    
    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleReply = () => {
    if (!selectedEmail || !replyText.trim() || !selectedEvent) return;
    
    alert(`Email sent from: reply@${selectedEvent.replyDomain}\nTo: ${selectedEmail.from}\n\nMessage: ${replyText}`);
    setReplyText('');
    setSelectedEmail(null);
  };

  const handleLabelEmail = (emailId: number, labelId: string) => {
    setEmails(prev => prev.map(email => {
      if (email.id === emailId) {
        const hasLabel = email.labels.includes(labelId);
        return {
          ...email,
          labels: hasLabel 
            ? email.labels.filter((l: string) => l !== labelId)
            : [...email.labels, labelId]
        };
      }
      return email;
    }));
    setShowLabelModal(false);
  };

  const handleUnsubscribe = (emailId: number) => {
    if (confirm('Are you sure you want to unsubscribe this contact?')) {
      setEmails(prev => prev.map(email => 
        email.id === emailId 
          ? { ...email, isUnsubscribed: true, labels: [...new Set([...email.labels, 'unsubscribe'])] }
          : email
      ));
      alert('Contact added to unsubscribe list and backend updated.');
    }
  };

  const getLabelColor = (labelId: string): string => {
    return labels.find(l => l.id === labelId)?.color || 'bg-gray-100 text-gray-800';
  };

  const eventEmails = getEventEmails();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Reply Management System</h1>
          <p className="text-sm text-gray-600 mt-1">Unified inbox with custom reply domains</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Event Selector */}
          <div className="col-span-3 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Events</h2>
            <div className="space-y-2">
              {events.map(event => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedEvent?.id === event.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm">{event.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {event.assignedDomains.length} domains
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email List */}
          <div className="col-span-5 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Unified Inbox
                  {selectedEvent && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({eventEmails.length})
                    </span>
                  )}
                </h2>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* Label Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setLabelFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs ${
                    labelFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100'
                  }`}
                >
                  All
                </button>
                {labels.map(label => (
                  <button
                    key={label.id}
                    onClick={() => setLabelFilter(label.id)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      labelFilter === label.id ? label.color : 'bg-gray-100'
                    }`}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {eventEmails.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No emails found</p>
                </div>
              ) : (
                eventEmails.map(email => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{email.from}</div>
                        <div className="text-sm text-gray-900 mt-1">{email.subject}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(email.receivedAt).toLocaleString()}
                        </div>
                      </div>
                      {email.isUnsubscribed && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Unsubscribed
                        </span>
                      )}
                    </div>
                    {email.labels.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {email.labels.map((labelId: string) => (
                          <span
                            key={labelId}
                            className={`text-xs px-2 py-1 rounded ${getLabelColor(labelId)}`}
                          >
                            {labels.find(l => l.id === labelId)?.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Detail & Reply */}
          <div className="col-span-4 bg-white rounded-lg shadow">
            {selectedEmail ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold mb-2">Email Details</h2>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium">From:</span> {selectedEmail.from}
                    </div>
                    <div>
                      <span className="font-medium">Subject:</span> {selectedEmail.subject}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setShowLabelModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      <Tag className="w-4 h-4" />
                      Label
                    </button>
                    {!selectedEmail.isUnsubscribed && (
                      <button
                        onClick={() => handleUnsubscribe(selectedEmail.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        <UserX className="w-4 h-4" />
                        Unsubscribe
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 border-b flex-1 overflow-y-auto">
                  <h3 className="font-medium text-sm mb-2">Message:</h3>
                  <p className="text-sm text-gray-700">{selectedEmail.body}</p>
                </div>

                <div className="p-4 border-t">
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">
                      Reply from: reply@{selectedEvent?.replyDomain}
                    </div>
                    <div className="text-xs text-gray-600">
                      To: {selectedEmail.from}
                    </div>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full p-3 border rounded-lg text-sm resize-none"
                    rows={4}
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                    className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Send Reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select an email to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Label Modal */}
      {showLabelModal && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Label</h3>
            <div className="space-y-2">
              {labels.map(label => (
                <button
                  key={label.id}
                  onClick={() => handleLabelEmail(selectedEmail.id, label.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 ${
                    selectedEmail.labels.includes(label.id)
                      ? `${label.color} border-current`
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {label.name}
                  {selectedEmail.labels.includes(label.id) && (
                    <span className="float-right">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLabelModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplyManagementCRM;