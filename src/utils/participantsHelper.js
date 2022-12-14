import { getRDFasJson } from "./fetchHelper";

export async function fetchContacts(
  participants,
  solidFetch,
  setValidParticipants,
  setInvalidParticipants,
  employeesUrl
) {
  const fetchedWebIds = await fetchWebIDs(employeesUrl, solidFetch);
  fetchedWebIds.forEach((id) => {
    participants[id] = {};
  });

  console.info("All participants' WebIDs fetched (without data).");

  await fetchParticipantWebIdData(
    participants,
    solidFetch,
    setValidParticipants,
    setInvalidParticipants
  );
  console.log("All participants' WebIDs fetched (with data).");
  console.log(participants);
}

export async function fetchWebIDs(employeesUrl, fetch) {
  const frame = {
    "@context": {
      "@vocab": "http://schema.org/",
    },
    employee: {},
  };

  const result = await getRDFasJson(employeesUrl, frame, fetch);
  console.log("My fetched contacts:");
  console.log(result);
  const ids = result.employee.map((a) => a["@id"]);

  return ids;
}

export async function fetchParticipantWebIdData(
  participants,
  fetch,
  setValid,
  setInvalid
) {
  const webids = Object.keys(participants);

  let validList = [];
  let invalidList = [];

  for (let i = 0; i < webids.length; i++) {
    const id = webids[i];

    if (id != "dummy1" || id != "dummy2") {
      try {
        const frame = {
          "@context": {
            "@vocab": "http://xmlns.com/foaf/0.1/",
            knows: "https://data.knows.idlab.ugent.be/person/office/#",
            schema: "http://schema.org/",
            vcard: "http://www.w3.org/2006/vcard/ns#",
          },
          "@id": id,
        };

        if (
          id === "https://elsdvlee.pod.knows.idlab.ugent.be/profile/card#me"
        ) {
          continue;
        }
        const result = await getRDFasJson(id, frame, fetch);
        if (result.length === 0) {
          participants[id].error = "No results in JSON-LD";
          return;
        }

        let availabilityCalendar = undefined;
        let vacationCalendar = undefined;

        if (
          result["knows:hasAvailabilityCalendar"] &&
          result["knows:hasAvailabilityCalendar"]["schema:url"]
        ) {
          availabilityCalendar =
            result["knows:hasAvailabilityCalendar"]["schema:url"];
        }

        if (result["knows:hasVacationCalendar"]) {
          vacationCalendar = result["knows:hasVacationCalendar"]["@id"];
        }

        let email = result["mbox"] || result["vcard:hasEmail"];

        if (email) {
          if (email["@id"]) {
            email = email["@id"];
          }
          email = email.replace("mailto:", "");
        }

        participants[id] = {
          name: getPersonName(result) || id,
          availabilityCalendar: {
            url: availabilityCalendar,
            status: "not-downloaded",
          },
          vacationCalendar: {
            url: vacationCalendar,
            status: "not-downloaded",
          },
          email,
        };
      } catch (e) {
        if (e.includes && e.includes("conversion")) {
          participants[id].error = e;
        } else {
          participants[id].error = "Unable to fetch data.";
        }
      }
    }
    const participant = participants[id];
    let item = {};
    item["name"] = participant.name || id;
    item["id"] = id;
    if (Object.keys(participant).length === 0) {
      return;
    }
    if (participant.error || !participant.availabilityCalendar.url) {
      if (participant.error) {
        item["error"] = "(Error: " + participant.error + ")";
      } else {
        item["error"] = " (No availability calendar found.)";
      }
      invalidList = [...invalidList, item];
      if (setInvalid) {
        setInvalid(invalidList);
      }
    } else {
      validList = [...validList, item];
      if (setValid) {
        setValid(validList);
      }
    }
  }
}

export function getPersonName(person) {
  if (person.name) {
    if (Array.isArray(person.name)) {
      return person.name[0]["@value"];
    } else {
      if (person.name["@value"]) {
        return person.name["@value"];
      } else return person.name;
    }
  } else if (person.givenName) {
    if (Array.isArray(person.givenName)) {
      return (
        person.givenName[0]["@value"] + " " + person.familyName[0]["@value"]
      );
    } else {
      return person.givenName["@value"] + " " + person.familyName["@value"];
    }
  }
}
