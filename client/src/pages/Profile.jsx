import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api.js';
import { useAuth } from '../auth/useAuth.js';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setSaving(true);

    try {
      const response = await api('/auth/me', {
        method: 'PATCH',
        body: { name: name.trim() },
      });

      setUser(response.data);
      setName(response.data.name);
      setSuccess('Your name has been updated.');
    } catch (err) {
      setError(err.message || 'Could not update your name.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 sm:p-8">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← Back to home
      </Link>

      <h1 className="mt-6 text-3xl font-bold">My Profile</h1>
      <p className="mt-2 text-gray-600">
        View your account details and update your name.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="profile-name" className="mb-2 block font-medium">
            Name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={100}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="mb-2 block font-medium">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={user?.email ?? ''}
            readOnly
            className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </main>
  );
}
