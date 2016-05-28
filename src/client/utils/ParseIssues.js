import _ from 'lodash';
import moment from 'moment';
import Immutable from 'immutable';

export default (issues) => {
  const sortedIssues = _.sortBy(issues, (item) => moment(item.created_at).valueOf());
  let dates = {};

  for (let i = 0; i < issues.length; i++) {
    const createdDate = moment(sortedIssues[i].created_at);
    const now = moment();
    const endDate = moment(sortedIssues[i].closed_at || now);
    let dateIndex = createdDate;

    do {
      if (_.has(dates, dateIndex.format('YYYY-MM-DD'))) {
        dates[dateIndex.format('YYYY-MM-DD')].push(issues[i].number);
      } else {
        dates[dateIndex.format('YYYY-MM-DD')] = [issues[i].number];
      }
      dateIndex = moment(dateIndex).add(1, 'day');
    } while (dateIndex.format('YYYY-MM-DD') <= endDate.format('YYYY-MM-DD'))
  }

  return _.map(dates, (val, key) => {
    return {
      x: moment(key).toDate(),
      y: val.length
    };
  });
};
