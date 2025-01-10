'use client'

import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const ButtonModal = ({
  children,
  props,
  onPressHandler,
  id,
  title="",
  iconName="",
  warningText="",
  buttonActionText="",
  canCancel=true,
  isButton=true
}) => {

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handlePress = () => {
    onPressHandler(id)
    handleClose()
  }

  return (
    <>
      {isButton ? (
        <Button variant="outline-dark" className="material-symbols-outlined" onClick={handleShow}>
          {iconName}
        </Button>
      ) : (
        <span className="material-symbols-outlined" onClick={handleShow}>{iconName}</span>
      ) }

      <Modal 
        show={show} 
        onHide={handleClose}
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>{children}</div><br/>
          {warningText.length>0 ? (<div className="warning-box">{warningText}</div>) : <></>}
        </Modal.Body>
        <Modal.Footer>
          {canCancel ? (
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          ) : (<></>)}
          {buttonActionText.length>0 ? (
          <Button variant="primary" onClick ={(e) => {
              e.preventDefault();
              handlePress()
            }
          }>
            {buttonActionText}
          </Button>
          ) : (<></>)}
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ButtonModal;