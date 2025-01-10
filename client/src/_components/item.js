'use client'
 
import { getItemListingID } from '@/_helpers/utills'

const Item = ({
    item_id, itemContent, label=null, status=null
  }) => {

    return itemContent.map((content, index) => {
        
        const id = getItemListingID(item_id,index)
        let key = label!=null ? label+"-"+id : id
        return (
            <span id={key} key={id} >
                <p className={status != null ? "textChunk " + status : "textChunk"}>
                    { content.text } 
                </p>
            </span>
        )

    })
        
}

export default Item
  
  