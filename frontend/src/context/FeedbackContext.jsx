import React, { createContext, useContext, useState, useCallback } from 'react';
import { FeedbackModal } from '../components/feedback/FeedbackModal';

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'info', // 'success' | 'error' | 'warning' | 'info' | 'confirm'
    title: '',
    message: '',
    details: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    confirmVariant: 'danger', // 'danger' | 'primary' | 'warning'
  });

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback(({ title = 'Operation Successful', message = 'The requested action has been completed.', onConfirm = null }) => {
    setModalState({
      isOpen: true,
      type: 'success',
      title,
      message,
      details: null,
      confirmText: 'Done',
      cancelText: null,
      onConfirm: () => {
        closeModal();
        if (onConfirm) onConfirm();
      },
      onCancel: closeModal,
      confirmVariant: 'primary',
    });
  }, [closeModal]);

  const showError = useCallback(({ title = 'Operation Failed', message = 'An error occurred while processing your request.', details = null, onConfirm = null }) => {
    setModalState({
      isOpen: true,
      type: 'error',
      title,
      message,
      details,
      confirmText: 'Close',
      cancelText: null,
      onConfirm: () => {
        closeModal();
        if (onConfirm) onConfirm();
      },
      onCancel: closeModal,
      confirmVariant: 'danger',
    });
  }, [closeModal]);

  const showInfo = useCallback(({ title = 'Information', message = '', details = null, onConfirm = null }) => {
    setModalState({
      isOpen: true,
      type: 'info',
      title,
      message,
      details,
      confirmText: 'OK',
      cancelText: null,
      onConfirm: () => {
        closeModal();
        if (onConfirm) onConfirm();
      },
      onCancel: closeModal,
      confirmVariant: 'primary',
    });
  }, [closeModal]);

  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning', // 'danger' | 'warning'
    onConfirm,
    onCancel = null,
  }) => {
    setModalState({
      isOpen: true,
      type: 'confirm',
      confirmVariant: type === 'danger' ? 'danger' : 'warning',
      title,
      message,
      details: null,
      confirmText,
      cancelText,
      onConfirm: () => {
        closeModal();
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        closeModal();
        if (onCancel) onCancel();
      },
    });
  }, [closeModal]);

  return (
    <FeedbackContext.Provider
      value={{
        showSuccess,
        showError,
        showInfo,
        showConfirm,
        closeModal,
      }}
    >
      {children}
      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        details={modalState.details}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        confirmVariant={modalState.confirmVariant}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
