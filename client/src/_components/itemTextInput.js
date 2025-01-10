'use client'
 
import { getItemListingID } from '@/_helpers/utills'

const ItemTextInput = ({
    ref_id,item_id, itemContent, onInputComplete
  }) => {

    const handleChange = (e) => {
        onInputComplete(ref_id,e.target.id,e.target.value)
    }
        
        const id = getItemListingID(item_id,0)
        return (
            <span key={id} >
                <textarea id={id} rows="3" cols="10" defaultValue={itemContent} onBlur={handleChange}/>
            </span>
        )
        
}

export default ItemTextInput
  
  