const urlBase64ToUint8Array = base64String => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

const saveSubscription = async (subscription) => {
    const response = await fetch('http://localhost:3000/save-subscription', {
        method: 'post',
        headers: { 'Content-type': "application/json" },
        body: JSON.stringify(subscription)
    })

    return response.json()
}

self.addEventListener("activate", async (e) => {
    const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BHu3OagoXq8t45oeG7tKTfmeFRs7wV1kW_B3VI-6c-zlUBSWPLeQy81sudp9IaGGIzZ9LU8c0_7KZZqhMKgESYg")
    })

    const response = await saveSubscription(subscription)
    console.log(response)
})

self.addEventListener("push", e => {
    self.registration.showNotification("Wohoo!!", { body: e.data.text() })
})


// Public Key:
// BHu3OagoXq8t45oeG7tKTfmeFRs7wV1kW_B3VI-6c-zlUBSWPLeQy81sudp9IaGGIzZ9LU8c0_7KZZqhMKgESYg

// Private Key:
// bZwoDWBAOWl7WuvUi4JK8bEp4Dh55dUciON3t9gNIG8