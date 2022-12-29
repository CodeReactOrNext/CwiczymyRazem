import { NextApiRequest, NextApiResponse } from "next";
import { firebaseUploadAvatar, storage } from "utils/firebase/firebase.utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // console.log(req.body);
    // await firebaseUploadAvatar(req.body);
    // res.status(200).json({ message: "Image uploaded" });
    try {
      const file = req.body; // The file object
      await firebaseUploadAvatar(file);
      // const storageRef = ref(storage, file);
      // const fileRef = storageRef.child(file.name);
      // const snapshot = await fileRef.put(file);
      res.status(200).json({ file: file });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  }
  res.status(400);
}
