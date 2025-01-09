const checkPerimission = () => {
    if(!('serviceWorker' in navigator)){

        throw new Error("No support for service worker!")
    }

    if(!('Notification' in window)){
        throw new Error('No support for notification API');
    }
}

const registerSM = async () => {
    const registration = await navigator.serviceWorker.register('sw.js');
    return registration;
}

const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();

    if(permission !== 'granted'){
        throw new Error("Notification permission not granted")
    }
}

const main = async () => {
    checkPerimission()
    await requestNotificationPermission()
    await registerSM()
    // const reg = await registerSM()
    // reg.showNotification("Hi")
}

// main()