import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const TOPIC_OPTIONS = ['Algebra', 'Trigonometry', 'Probability', 'Geometry', 'Statistics'];

function ClassesTab({ classes, setClasses, tuitionId, isTeacher }) {
  const navigate = useNavigate();
  const [className, setClassName] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!className.trim() || selectedTopics.length === 0) return;

    setSaving(true);
    const { data, error } = await supabase
      .from('classes')
      .insert({
        tuition_id: tuitionId,
        name: className.trim(),
        topics: selectedTopics,
      })
      .select()
      .single();

    if (!error && data) {
      setClasses([data, ...classes]);
      setClassName('');
      setSelectedTopics([]);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Create Class Form - Teacher Only */}
      {isTeacher && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Class</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g., Class 10-A"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topics</label>
              <div className="flex flex-wrap gap-3">
                {TOPIC_OPTIONS.map(topic => (
                  <label key={topic} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic)}
                      onChange={() => handleTopicToggle(topic)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{topic}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || !className.trim() || selectedTopics.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Class'}
            </button>
          </form>
        </div>
      )}

      {/* Classes List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Classes</h3>
        </div>
        {classes.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No classes created yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {classes.map(cls => (
              <div
                key={cls.id}
                onClick={() => navigate(`class/${cls.id}`)}
                className="p-6 cursor-pointer hover:bg-slate-50"
              >
                <h4 className="text-md font-medium text-slate-900">{cls.name}</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cls.topics && cls.topics.map(topic => (
                    <span
                      key={topic}
                      className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassesTab;
