'use client'

import React, { Component, useState } from 'react';
import ReactDOM from 'react-dom';
import {getItemListingID} from '../_helpers/utills'
import { TextAnnotate } from "react-text-annotate-blend"

const TextHighlighter = ({item_id, fullText, highlight, onItemHighlight, ref_id}) => {

  const id = getItemListingID(item_id,0)
  
  const [value, setValue] = useState(highlight);
  
  const handleChange = (value) => {
    setValue(value)
    onItemHighlight(ref_id, id, value)
    
}

  return (
    <TextAnnotate
      content={fullText}
      onChange={handleChange}
      value={value}
      getSpan={(span) => ({
        ...span,
        color: "#FFEA00"
      })}
    />
  )
}

export default TextHighlighter

