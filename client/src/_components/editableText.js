'use client'

import React, { Component, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import {getItemListingID} from '../_helpers/utills'
import { TextAnnotate } from "react-text-annotate-blend"

const EditableText = ({
  children,
  onEditStart=()=>{}, 
  onEditSubmit=()=>{},
  onEditComplete=()=>{}
}) => {
  
  const [editableText, setEditableText] = useState(false)
  const [editMode, setEditMode] = useState(false)
  
  const toggleEdit = () => {
    setEditMode(!editMode)
    if (editMode){
      onEditStart()
    } else {
      onEditComplete()
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    onEditSubmit(editableText)
    setEditMode(false)
  }

  useEffect(()=>{
    setEditableText(children)
  },[children])

  return (
    <>
      {!editMode ? (
        <>
          <span>{editableText}</span>
          <button type="button" className='material-symbols-outlined' onClick={(toggleEdit)}>edit</button>
        </>
      ) : (
        <>
          <form>
            <input size={editableText.length} value={editableText} onChange={(e) => {setEditableText(e.target.value)}}/>
            <button type="submit" className='material-symbols-outlined' onClick={(handleChange)}>check</button>
            <button type="button" className='material-symbols-outlined' onClick={(toggleEdit)}>cancel</button>
          </form>
        </>
      )}
    </>
  )
}

export default EditableText

