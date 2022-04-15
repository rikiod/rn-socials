import React, { useState, useEffect } from "react";
import { Platform, View } from "react-native";
import { Appbar, TextInput, Snackbar, Button } from "react-native-paper";
import { getFileObjectAsync, uuid } from "../../../Utils";

// See https://github.com/mmazzarolo/react-native-modal-datetime-picker
// Most of the date picker code is directly sourced from the example.
import DateTimePickerModal from "react-native-modal-datetime-picker";

// See https://docs.expo.io/versions/latest/sdk/imagepicker/
// Most of the image picker code is directly sourced from the example.
import * as ImagePicker from "expo-image-picker";
import { styles } from "./NewSocialScreen.styles";

import firebase from "firebase/app";
import "firebase/firestore";
import { SocialModel } from "../../../models/social";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../RootStackScreen";

import { Firestore, getFirestore, doc, collection, setDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { getApp } from "firebase/app";

interface Props {
  navigation: StackNavigationProp<RootStackParamList, "NewSocialScreen">;
}

export default function NewSocialScreen({ navigation }: Props) {
  /* TODO: Declare state variables for all of the attributes 
           that you need to keep track of on this screen.

      1. There are five core attributes that are related to the social object.
  */
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventImage, setImage] = useState("");

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isDateSelected, setDateSelected] = useState(false);

  const [snackBarMessage, setSnackBarMessage] = useState("");
  const [isSnackBarVisible, setSnackBarVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false);



  // TODO: Follow the Expo Docs to implement the ImagePicker component.
  // https://docs.expo.io/versions/latest/sdk/imagepicker/
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);
  
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };


  // TODO: Follow the GitHub Docs to implement the react-native-modal-datetime-picker component.
  // https://github.com/mmazzarolo/react-native-modal-datetime-picker
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };
  
  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    console.warn("A date has been picked: ", date);
    setDateSelected(true);
    setEventDate(date);
    hideDatePicker();
  };

  // TODO: Follow the SnackBar Docs to implement the Snackbar component.
  // https://callstack.github.io/react-native-paper/snackbar.html
  const onToggleSnackBar = () => setSnackBarVisible(!isSnackBarVisible);

  const onDismissSnackBar = () => setSnackBarVisible(false);

  const showError = (error: string) => {
    setSnackBarMessage(error);
    setSnackBarVisible(true);
  };

  const saveEvent = async () => {
    // TODO: Validate all fields (hint: field values should be stored in state variables).
    // If there's a field that is missing data, then return and show an error
    // using the Snackbar.

    // Otherwise, proceed onwards with uploading the image, and then the object.
    if (!eventName) {
      showError("Please enter an event name.");
      return;
    } else if (!eventDate) {
      showError("Please enter an event date.");
      return;
    } else if (!eventLocation) {
      showError("Please enter an event location.");
      return;
    } else if (!eventDescription) {
      showError("Please enter an event description.");
      return;
    } else if (!eventImage) {
      showError("Please choose an event image.");
      return;
    } else {
      console.log("Is loading");
      setIsLoading(true);
    }

    try {

      // NOTE: THE BULK OF THIS FUNCTION IS ALREADY IMPLEMENTED FOR YOU IN HINTS.TSX.
      // READ THIS TO GET A HIGH-LEVEL OVERVIEW OF WHAT YOU NEED TO DO, THEN GO READ THAT FILE!

      // (0) Firebase Cloud Storage wants a Blob, so we first convert the file path
      // saved in our eventImage state variable to a Blob.

      // (1) Write the image to Firebase Cloud Storage. Make sure to do this
      // using an "await" keyword, since we're in an async function. Name it using
      // the uuid provided below.

      // (2) Get the download URL of the file we just wrote. We're going to put that
      // download URL into Firestore (where our data itself is stored). Make sure to
      // do this using an async keyword.

      // (3) Construct & write the social model to the "socials" collection in Firestore.
      // The eventImage should be the downloadURL that we got from (3).
      // Make sure to do this using an async keyword.
      
      // (4) If nothing threw an error, then go back to the previous screen.
      //     Otherwise, show an error.

      console.log("Entered try");
      const asyncAwaitNetworkRequests = async () => {
        const object = await getFileObjectAsync(eventImage);
        const db = getFirestore();
        const storage = getStorage(getApp());
        const storageRef = ref(storage, uuid() + ".jpg");
        console.log("About to make social ref");
        const socialRef = doc(collection(db, "socials"));
        console.log("About to upload image");
        const result = await uploadBytesResumable(storageRef, object as Blob);
        console.log("About to receive download URL");
        const downloadURL = await getDownloadURL(result.ref);
        const socialDoc: SocialModel = {
          eventName: eventName,
          eventDate: eventDate.getTime(),
          eventLocation: eventLocation,
          eventDescription: eventDescription,
          eventImage: downloadURL,
        };
        console.log("About to write social");
        await setDoc(socialRef, socialDoc); 
        console.log("Finished social creation.");
      };

      await asyncAwaitNetworkRequests();
      setIsLoading(false);
      navigation.goBack();

    } catch (e) {
      console.log("Error while writing social:", e);
    }
  };

  const Bar = () => {
    return (
      <Appbar.Header>
        <Appbar.Action onPress={navigation.goBack} icon="close" />
        <Appbar.Content title="Socials" />
      </Appbar.Header>
    );
  };

  return (
    <>
      <Bar />
      <View style={{ ...styles.container, padding: 20 }}>
        <TextInput
          autoComplete="off"
          label="Event Name"
          value={eventName}
          onChangeText={(name: any) => setEventName(name)}
          style={styles.textInput}
        />
        <TextInput
          autoComplete="off"
          label="Event Location"
          value={eventLocation}
          onChangeText={(location: any) => setEventLocation(location)}
          style={styles.textInput}
        />
        <TextInput
          autoComplete="off"
          label="Event Description"
          value={eventDescription}
          multiline={true}
          onChangeText={(desc: any) => setEventDescription(desc)}
          style={styles.textInput}
        />
        <Button
          mode="outlined"
          onPress={showDatePicker}
          style={styles.button}
        >
          Select Date
        </Button>
        <Button mode="outlined" onPress={pickImage} style={{ marginTop: 20 }}>
          {eventImage ? "Change Image" : "Pick an Image"}
        </Button>
        <Button
          mode="contained"
          onPress={saveEvent}
          style={styles.button}
          loading={isLoading}
        >
          Save Event
        </Button>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
        <Snackbar
          duration={3000}
          visible={isSnackBarVisible}
          onDismiss={onDismissSnackBar}
        >
          {snackBarMessage}
        </Snackbar>
      </View>
    </>
  );
}
