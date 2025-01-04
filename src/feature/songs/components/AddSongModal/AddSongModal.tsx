import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { addSong } from 'utils/firebase/client/firebase.utils';
import { useAppSelector } from 'store/hooks';
import { selectUserAuth } from 'feature/user/store/userSlice';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSongModal = ({ isOpen, onClose, onSuccess }: AddSongModalProps) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('songs');
  const userId = useAppSelector(selectUserAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error(t('must_be_logged_in'));
      return;
    }

    try {
      setIsLoading(true);
      await addSong(title, artist, userId);
      toast.success(t('song_added'));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(t('error_adding_song'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{t('add_new_song')}</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('song_title')}</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>
          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text">{t('artist')}</span>
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="input input-bordered"
              required
            />
          </div>
          <div className="modal-action">
            <button 
              type="button" 
              className="btn" 
              onClick={onClose}
              disabled={isLoading}
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner" />
              ) : t('add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSongModal; 