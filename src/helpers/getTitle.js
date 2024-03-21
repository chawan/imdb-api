import apiRequestRawHtml from "./apiRequestRawHtml";
import DomParser from "dom-parser";
import seriesFetcher from "./seriesFetcher";

export default async function getTitle(id) {
  const parser = new DomParser();
  const html = await apiRequestRawHtml(`https://www.imdb.com/title/${id}`);
  const dom = parser.parseFromString(html);
  const nextData = dom.getElementsByAttribute("id", "__NEXT_DATA__");
  const json = JSON.parse(nextData[0].textContent);

  const props = json.props.pageProps;

  const getCredits = (lookFor, v) => {
    const result = props.aboveTheFoldData.principalCredits.find(
      (e) => e?.category?.id === lookFor
    );

    return result
      ? result.credits.map((e) => {
          if (v === "2")
            return {
              id: e.name.id,
              name: e.name.nameText.text,
            };

          return e.name.nameText.text;
        })
      : [];
  };

  const resultArray = [
    id,
    `/reviews/${id}`,
    `https://www.imdb.com/title/${id}`,
    props.aboveTheFoldData.titleType.id,
    props.aboveTheFoldData?.certificate?.rating ?? "N/A",
    props.aboveTheFoldData.titleType.isSeries,
    props.aboveTheFoldData.productionStatus.currentProductionStage.id,
    props.aboveTheFoldData.productionStatus.currentProductionStage.id ===
      "released",
    props.aboveTheFoldData.titleText.text,
    props.aboveTheFoldData.primaryImage.url,
    props.mainColumnData.titleMainImages.edges
      .filter((e) => e.__typename === "ImageEdge")
      .map((e) => e.node.url),
    props.aboveTheFoldData.plot.plotText.plainText,
    props.aboveTheFoldData.runtime?.displayableProperty?.value?.plainText ?? "",
    props.aboveTheFoldData.runtime?.seconds ?? 0,
    props.aboveTheFoldData.ratingsSummary?.voteCount ?? 0,
    props.aboveTheFoldData.ratingsSummary?.aggregateRating ?? 0,
    props.mainColumnData.wins?.total ?? 0,
    props.mainColumnData.nominations?.total ?? 0,
    props.aboveTheFoldData.genres.genres.map((e) => e.id),
    new Date(
      props.aboveTheFoldData.releaseDate.year,
      props.aboveTheFoldData.releaseDate.month - 1,
      props.aboveTheFoldData.releaseDate.day
    ).toISOString(),
    props.aboveTheFoldData.releaseDate.day,
    props.aboveTheFoldData.releaseDate.month,
    props.aboveTheFoldData.releaseDate.year,
    props.mainColumnData.releaseDate?.country?.text,
    props.mainColumnData.releaseDate?.country?.id,
    props.mainColumnData.countriesOfOrigin.countries.map((e) => ({
      country: e.text,
      cca2: e.id,
    })),
    props.mainColumnData.spokenLanguages.spokenLanguages.map((e) => ({
      language: e.text,
      id: e.id,
    })),
    props.mainColumnData.filmingLocations.edges.map((e) => e.node.text),
    getCredits("cast"),
    getCredits("cast", "2"),
    getCredits("creator"),
    getCredits("creator", "2"),
    getCredits("director"),
    getCredits("director", "2"),
    getCredits("writer"),
    getCredits("writer", "2"),
    props.aboveTheFoldData.principalCredits.map((e) => ({
      id: e.category.id,
      name: e.category.text,
      credits: e.credits.map((e) => e.name.nameText.text),
    })),
  ];

  if (props.aboveTheFoldData.titleType.isSeries) {
    const seriesData = await seriesFetcher(id);
    resultArray.push(seriesData);
  }

  return resultArray;
}
