createSrchObj = function (query, type, option, trackID, dataApi, searchLimit) {
    return {
        query: query,
        type: type,
        option: option,
        trackID: trackID,
        dataApi: dataApi,
        searchLimit: searchLimit
    }
};
