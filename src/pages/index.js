import Head from "next/head";
import { useEffect, useState } from "react";
import { useSession } from "@inrupt/solid-ui-react";
import { getPersonName } from "../utils/participantsHelper";
import { getRDFasJson } from "../utils/fetchHelper";
import Configuration from "../components/Configuration";

export default function Home() {
  const { session, sessionRequestInProgress } = useSession();
  const [name, setName] = useState("");

  useEffect(() => {
    const webID = session.info.webId;
    if (webID !== undefined) {
      const frame = {
        "@context": {
          "@vocab": "http://xmlns.com/foaf/0.1/",
          knows: "https://data.knows.idlab.ugent.be/person/office/#",
          schema: "http://schema.org/",
        },
        "@id": webID,
      };

      (async () => {
        const data = await getRDFasJson(webID, frame, fetch);
        setName(getPersonName(data) || webID);
      })();
    }
  }, [session.info.webId]);

  if (sessionRequestInProgress) {
    console.log(sessionRequestInProgress);
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Head>
        <title>Solid Calendar</title>
        <meta name="description" content="Calendar using solid protocol" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {session.info.isLoggedIn ? (
          <>
            <Configuration />
          </>
        ) : (
          <>
            <h3>KNoodle orchestrator</h3>
            <p>
              KNoodle is KNoWS' Solid-based alternative to Doodle. It allows you
              to find time slots that work for different people, by using their
              availability calendar which is made available through a Solid pod.
            </p>
            <p>Login with a CSS pod!</p>
          </>
        )}
      </main>
    </div>
  );
}
