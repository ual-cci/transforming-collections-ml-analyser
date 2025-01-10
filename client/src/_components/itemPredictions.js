'use client'

const getItemPredictionID = (item_index, item_component_index) => {
    var itemTypeRef = "text"
    const id = [itemTypeRef,"prediction","artwork", String(item_index), itemTypeRef, String(item_component_index)].join("-")
    return id
}

const ItemPredictions = ({
    item_id,
    predictions
}) =>{

    const id = getItemPredictionID(item_id,0)

    if(predictions != undefined && predictions.length>0){
        return predictions.map((prediction, index) => {
            const id = getItemPredictionID(item_id,index)
            const inner_id = ["p",id].join("-")

            return (
                <span key={id}>
                    <p id={inner_id} className="textChunk">
                        { prediction }
                    </p>
                </span>
            )
        })
    } else {
        return (<span key={id}></span>)
    }

}

export default ItemPredictions