const pointsFromPairs = pairs => pairs.map(([homePoint, awayPoint]) => ({
    homePoint,
    awayPoint
}));

export const verifiedPointByPointFixture = [
    {
        set: 2,
        games: [
            {
                game: 7,
                points: pointsFromPairs([
                    ['15', '0'],
                    ['30', '0'],
                    ['30', '15'],
                    ['40', '15'],
                    ['40', '30']
                ])
            },
            {
                game: 8,
                points: pointsFromPairs([
                    ['0', '15'],
                    ['15', '15'],
                    ['15', '30'],
                    ['15', '40']
                ])
            },
            {
                game: 9,
                points: pointsFromPairs([
                    ['0', '15'],
                    ['0', '30'],
                    ['0', '40']
                ])
            },
            {
                game: 10,
                points: pointsFromPairs([
                    ['0', '15'],
                    ['0', '30'],
                    ['15', '30'],
                    ['15', '40']
                ])
            }
        ]
    }
];

export const verifiedHomeLeadingPointByPointFixture = [
    {
        set: 3,
        games: [
            {
                game: 6,
                points: pointsFromPairs([
                    ['0', '15'],
                    ['15', '15'],
                    ['30', '15'],
                    ['30', '30'],
                    ['40', '30']
                ])
            },
            {
                game: 7,
                points: pointsFromPairs([
                    ['15', '0'],
                    ['15', '15'],
                    ['15', '30'],
                    ['30', '30'],
                    ['30', '40'],
                    ['40', '40'],
                    ['A', '40'],
                    ['40', '40'],
                    ['A', '40'],
                    ['40', '40'],
                    ['40', 'A'],
                    ['40', '40'],
                    ['A', '40'],
                    ['40', '40'],
                    ['40', 'A']
                ])
            },
            {
                game: 8,
                points: pointsFromPairs([
                    ['0', '15'],
                    ['15', '15'],
                    ['15', '30'],
                    ['30', '30'],
                    ['40', '30']
                ])
            },
            {
                game: 9,
                points: pointsFromPairs([
                    ['0', '15'],
                    ['0', '30'],
                    ['0', '40']
                ])
            }
        ]
    }
];

export const verifiedUnsupportedTieBreakGame = {
    game: 13,
    points: pointsFromPairs([
        ['0', '1'],
        ['0', '2'],
        ['0', '3'],
        ['1', '3'],
        ['2', '3'],
        ['2', '4'],
        ['2', '5'],
        ['3', '5'],
        ['4', '5'],
        ['4', '6'],
        ['5', '6'],
        ['6', '6'],
        ['6', '7'],
        ['7', '7'],
        ['7', '8'],
        ['8', '8'],
        ['9', '8'],
        ['9', '9'],
        ['10', '9'],
        ['10', '10'],
        ['11', '10'],
        ['11', '11'],
        ['12', '11'],
        ['12', '12'],
        ['13', '12'],
        ['13', '13'],
        ['13', '14'],
        ['14', '14'],
        ['15', '14'],
        ['16', '14']
    ])
};
